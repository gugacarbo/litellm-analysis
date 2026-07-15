import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createBenchmarksRepository } from "@lite-llm/benchmarks-repository";
import type { PaginationMetadata } from "@lite-llm/contracts/analytics";
import type {
  ModelBenchmarkApiResponse,
  ModelBenchmarkListItem,
  NormalizedModelBenchmark,
} from "@lite-llm/contracts/benchmarks";
import {
  getWorkspaceRoot,
  loadBenchmarkDataset,
  loadModelAliases,
  resolveStoragePath,
  toCompactKey,
  toMatchKeys,
} from "@lite-llm/server/orchestration/benchmark-helpers";
import { registerAllRoutes } from "@lite-llm/server/routes";
import type { RouteOptions } from "@lite-llm/server/types";
import express, { type Application } from "express";
import type { BenchmarkSyncApplicationService } from "../application/benchmark-sync-application-service";
import { createHealthCheckApplicationService } from "../application/health-check-application-service";
import type { OpenRouterBenchmarkSyncApplicationService } from "../application/openrouter-benchmark-sync-application-service";
import type { AppContext } from "../contexts";
import { env } from "../env";
import { createBenchmarkSyncRouter } from "../routes/benchmark-sync-routes";
import { createHealthCheckRouter } from "../routes/health-check-routes";
import { createOpenRouterBenchmarkSyncRouter } from "../routes/openrouter-benchmark-sync-routes";
import { unregisterLegacyMutationRoutes } from "./legacy-route-guard";

function parseBooleanQuery(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

function parseNumberQuery(
  value: unknown,
  fallback: number | null,
): number | null {
  if (typeof value !== "string" || value === "") return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseStringQuery(
  value: unknown,
  fallback: string | null,
): string | null {
  if (typeof value !== "string" || value === "") return fallback;
  return value;
}

/**
 * Suffix-tolerant fallback matching.
 * For an unmatched AA model, check if its slug compact key is a prefix of
 * any configured model's compact key where the remainder is alphabetic only.
 * This handles cases like "MiniMax-M2.7-highspeed" → AA slug "minimax-m2-7"
 * without creating false positives (e.g. "Kimi K2" vs "kimi-k2.6").
 * Returns the matched configured model name, or null if ambiguous / no match.
 */
function suffixTolerantMatch(
  aaSlugCompact: string,
  configuredCompacts: Map<string, string>,
): string | null {
  const matches: string[] = [];

  for (const [configuredCompact, configuredName] of configuredCompacts) {
    if (configuredCompact.length <= aaSlugCompact.length) continue;
    if (!configuredCompact.startsWith(aaSlugCompact)) continue;

    const remainder = configuredCompact.slice(aaSlugCompact.length);
    // Only match if the remainder is purely alphabetic (no digits)
    if (/^[a-z]+$/.test(remainder)) {
      matches.push(configuredName);
    }
  }

  return matches.length === 1 ? matches[0] : null;
}

interface BenchmarkFilterParams {
  search: string | null;
  provider: string | null;
  minIntelligence: number | null;
  maxPrice: number | null;
  configuredOnly: boolean;
}

interface BenchmarkSortParams {
  sortField:
    | "name"
    | "provider"
    | "intelligence"
    | "price"
    | "speed"
    | "latency";
  sortDirection: "asc" | "desc";
}

function parseBenchmarkPaginationQuery(req: express.Request): {
  page: number;
  pageSize: number;
} {
  const pageRaw = parseNumberQuery(req.query.page, 1);
  const pageSizeRaw = parseNumberQuery(req.query.page_size, 25);
  const page =
    pageRaw !== null && Number.isFinite(pageRaw) && pageRaw >= 1
      ? Math.floor(pageRaw)
      : 1;
  const pageSize =
    pageSizeRaw !== null && Number.isFinite(pageSizeRaw) && pageSizeRaw >= 0
      ? Math.floor(pageSizeRaw)
      : 25;
  return { page, pageSize };
}

function parseBenchmarkFilterParams(
  req: express.Request,
): BenchmarkFilterParams {
  const provider = parseStringQuery(req.query.provider, null);
  return {
    search: parseStringQuery(req.query.search, null),
    provider:
      provider && provider.trim().toLowerCase() !== "all" ? provider : null,
    minIntelligence: parseNumberQuery(req.query.min_intelligence, null),
    maxPrice: parseNumberQuery(req.query.max_price, null),
    configuredOnly: parseBooleanQuery(req.query.configuredOnly, false),
  };
}

function parseBenchmarkSortParams(req: express.Request): BenchmarkSortParams {
  const validFields: BenchmarkSortParams["sortField"][] = [
    "name",
    "provider",
    "intelligence",
    "price",
    "speed",
    "latency",
  ];
  const sortField =
    typeof req.query.sort_field === "string" &&
    validFields.includes(
      req.query.sort_field as BenchmarkSortParams["sortField"],
    )
      ? (req.query.sort_field as BenchmarkSortParams["sortField"])
      : "intelligence";
  const sortDirection =
    typeof req.query.sort_direction === "string" &&
    (req.query.sort_direction === "asc" || req.query.sort_direction === "desc")
      ? (req.query.sort_direction as "asc" | "desc")
      : "desc";
  return { sortField, sortDirection };
}

function buildConfiguredModelLookups(
  configuredModelNames: string[],
  aliases: Record<string, string>,
): {
  configuredLookup: Map<string, string>;
  configuredCompacts: Map<string, string>;
} {
  const configuredLookup = new Map<string, string>();
  for (const configured of configuredModelNames) {
    for (const key of toMatchKeys(configured)) {
      if (!configuredLookup.has(key)) {
        configuredLookup.set(key, configured);
      }
    }
  }

  for (const [configuredName, aaReference] of Object.entries(aliases)) {
    for (const key of toMatchKeys(aaReference)) {
      if (!configuredLookup.has(key)) {
        configuredLookup.set(key, configuredName);
      }
    }
  }

  const configuredCompacts = new Map<string, string>();
  for (const name of configuredModelNames) {
    configuredCompacts.set(toCompactKey(name), name);
  }

  return { configuredLookup, configuredCompacts };
}

function mapConfiguredBenchmarkModels(
  models: NormalizedModelBenchmark[],
  configuredLookup: Map<string, string>,
  configuredCompacts: Map<string, string>,
): { mapped: ModelBenchmarkListItem[]; matchedConfigs: Set<string> } {
  const matchedConfigs = new Set<string>();
  const mapped = models.map((model) => {
    const candidateKeys = [
      ...toMatchKeys(model.name),
      ...(model.slug ? toMatchKeys(model.slug) : []),
    ];
    const matched = candidateKeys.find((key) => configuredLookup.has(key));
    let matchedConfiguredModel = matched
      ? (configuredLookup.get(matched) ?? null)
      : null;

    if (!matchedConfiguredModel && model.slug) {
      const slugCompact = toCompactKey(model.slug);
      matchedConfiguredModel = suffixTolerantMatch(
        slugCompact,
        configuredCompacts,
      );
    }

    if (matchedConfiguredModel) {
      matchedConfigs.add(matchedConfiguredModel);
    }

    return {
      ...model,
      isConfigured: matchedConfiguredModel !== null,
      matchedConfiguredModel,
    };
  });
  return { mapped, matchedConfigs };
}

function matchesBenchmarkSearch(
  model: ModelBenchmarkListItem,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const targets = [
    model.name,
    model.slug,
    model.creatorName,
    model.creatorSlug,
  ];
  return targets.some((value) => value?.toLowerCase().includes(normalized));
}

function applyBenchmarkFilters(
  models: ModelBenchmarkListItem[],
  filters: BenchmarkFilterParams,
): ModelBenchmarkListItem[] {
  return models.filter((model) => {
    if (filters.configuredOnly && !model.isConfigured) return false;
    if (
      filters.provider &&
      model.creatorName.toLowerCase() !== filters.provider.toLowerCase()
    ) {
      return false;
    }
    if (filters.search && !matchesBenchmarkSearch(model, filters.search)) {
      return false;
    }
    if (
      filters.minIntelligence !== null &&
      (model.intelligenceIndex === null ||
        model.intelligenceIndex < filters.minIntelligence)
    ) {
      return false;
    }
    if (
      filters.maxPrice !== null &&
      (model.priceBlended1mTokens === null ||
        model.priceBlended1mTokens > filters.maxPrice)
    ) {
      return false;
    }
    return true;
  });
}

function applyBenchmarkSort(
  models: ModelBenchmarkListItem[],
  sort: BenchmarkSortParams,
): ModelBenchmarkListItem[] {
  const dir = sort.sortDirection === "asc" ? 1 : -1;
  return [...models].sort((a, b) => {
    switch (sort.sortField) {
      case "name":
        return dir * a.name.localeCompare(b.name);
      case "provider":
        return dir * a.creatorName.localeCompare(b.creatorName);
      case "intelligence":
        return (
          dir *
          ((a.intelligenceIndex ?? -Infinity) -
            (b.intelligenceIndex ?? -Infinity))
        );
      case "price":
        return (
          dir *
          ((a.priceBlended1mTokens ?? Infinity) -
            (b.priceBlended1mTokens ?? Infinity))
        );
      case "speed":
        return (
          dir *
          ((a.medianOutputTokensPerSecond ?? -Infinity) -
            (b.medianOutputTokensPerSecond ?? -Infinity))
        );
      case "latency":
        return (
          dir *
          ((a.medianTimeToFirstTokenSeconds ?? Infinity) -
            (b.medianTimeToFirstTokenSeconds ?? Infinity))
        );
      default:
        return 0;
    }
  });
}

function paginateBenchmarkModels(
  models: ModelBenchmarkListItem[],
  page: number,
  pageSize: number,
): {
  items: ModelBenchmarkListItem[];
  total: number;
  totalPages: number;
} {
  const total = models.length;
  if (pageSize <= 0) {
    return { items: models, total, totalPages: 1 };
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  return { items: models.slice(start, start + pageSize), total, totalPages };
}

function buildPaginationMetadata(
  total: number,
  page: number,
  pageSize: number,
  totalPages: number,
): PaginationMetadata {
  return {
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
  };
}

export function createApiServer(
  opts: RouteOptions,
  ctx: AppContext,
  services?: {
    benchmarkSync?: BenchmarkSyncApplicationService;
    openRouterBenchmarkSync?: OpenRouterBenchmarkSyncApplicationService;
  },
): Application {
  const app = express();
  const jsonParser = express.json();
  app.use((req, res, next) => {
    if (req.path === "/v1" || req.path.startsWith("/v1/")) {
      next();
      return;
    }
    jsonParser(req, res, next);
  });

  // Health / liveness probe — always returns 200
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Readiness probe — checks database connectivity
  app.get("/ready", async (_req, res) => {
    try {
      await ctx.analytics.checkReadiness();
      res.status(200).json({ status: "ok", database: "connected" });
    } catch {
      res.status(503).json({ status: "error", database: "disconnected" });
    }
  });

  app.get("/benchmarks/models", async (req, res) => {
    try {
      const workspaceRoot = getWorkspaceRoot();
      const storagePath = resolveStoragePath(workspaceRoot, env.STORAGE_PATH);

      const configuredModels = await opts.dataSource.getModels();
      // Strip backend suffix (e.g. "glm-5.1:ollama" -> "glm-5.1") for matching
      const configuredModelNames = configuredModels
        .map((item) => {
          const name = item.modelName ?? "";
          const idx = name.indexOf(":");
          return idx > 0 ? name.slice(0, idx) : name;
        })
        .filter((name): name is string => Boolean(name));

      const aliases = await loadModelAliases(storagePath);
      const { configuredLookup, configuredCompacts } =
        buildConfiguredModelLookups(configuredModelNames, aliases);

      let mapped: ModelBenchmarkListItem[] = [];
      let matchedConfigs = new Set<string>();
      let source = "Artificial Analysis";
      let sourceUrl = "https://artificialanalysis.ai/";
      let fetchedAt = "";

      try {
        const repo = createBenchmarksRepository();
        const dbModels = await repo.getAll();
        if (dbModels.length > 0) {
          const result = mapConfiguredBenchmarkModels(
            dbModels,
            configuredLookup,
            configuredCompacts,
          );
          mapped = result.mapped;
          matchedConfigs = result.matchedConfigs;
        }
      } catch (error) {
        console.error(
          "Failed to load benchmarks from database, falling back to JSON:",
          error,
        );
      }

      if (mapped.length === 0) {
        const benchmarkFilePath = path.join(
          storagePath,
          "benchmarks",
          "artificial-analysis-models.json",
        );
        const dataset = await loadBenchmarkDataset(benchmarkFilePath);
        const result = mapConfiguredBenchmarkModels(
          dataset.models,
          configuredLookup,
          configuredCompacts,
        );
        mapped = result.mapped;
        matchedConfigs = result.matchedConfigs;
        source = dataset.source;
        sourceUrl = dataset.sourceUrl;
        fetchedAt = dataset.fetchedAt;
      }

      const filters = parseBenchmarkFilterParams(req);
      const sort = parseBenchmarkSortParams(req);
      const { page, pageSize } = parseBenchmarkPaginationQuery(req);

      const filtered = applyBenchmarkFilters(mapped, filters);
      const sorted = applyBenchmarkSort(filtered, sort);
      const { items, total, totalPages } = paginateBenchmarkModels(
        sorted,
        page,
        pageSize,
      );

      const unmatchedConfiguredModels = configuredModelNames.filter(
        (name) => !matchedConfigs.has(name),
      );

      const response: ModelBenchmarkApiResponse = {
        source,
        sourceUrl,
        fetchedAt,
        count: total,
        configuredModelNames,
        unmatchedConfiguredModels,
        models: items,
        pagination: buildPaginationMetadata(total, page, pageSize, totalPages),
      };

      res.json(response);
    } catch (error) {
      const message = String(error);
      if (message.includes("ENOENT")) {
        res.status(404).json({
          error: "Benchmark data file not found. Trigger a sync from the UI.",
          code: "BENCHMARK_DATASET_MISSING",
        });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  function getAliasesFilePath(workspaceRoot: string): string {
    const storagePath = resolveStoragePath(workspaceRoot, env.STORAGE_PATH);
    return path.join(storagePath, "benchmarks", "model-aliases.json");
  }

  // Get current aliases
  app.get("/benchmarks/aliases", async (_req, res) => {
    try {
      const workspaceRoot = getWorkspaceRoot();
      const storagePath = resolveStoragePath(workspaceRoot, env.STORAGE_PATH);
      const aliases = await loadModelAliases(storagePath);
      res.json({ aliases });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Replace the full aliases map
  app.put("/benchmarks/aliases", async (req, res) => {
    try {
      const { aliases } = req.body as {
        aliases?: Record<string, string>;
      };
      if (!aliases || typeof aliases !== "object") {
        res.status(400).json({ error: "Missing or invalid 'aliases' field." });
        return;
      }

      const workspaceRoot = getWorkspaceRoot();
      const aliasesPath = getAliasesFilePath(workspaceRoot);
      const content = JSON.stringify(
        {
          $schema: "./artificial-analysis-models.schema.json",
          _comment:
            "Manual overrides for matching configured LiteLLM models to Artificial Analysis benchmark entries.",
          _format:
            "Key = configured model name, Value = AA model slug or name.",
          aliases,
        },
        null,
        2,
      );
      await writeFile(aliasesPath, content, "utf8");
      res.json({ aliases });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  if (services?.benchmarkSync) {
    app.use("/benchmarks", createBenchmarkSyncRouter(services.benchmarkSync));
  }

  if (services?.openRouterBenchmarkSync) {
    app.use(
      "/benchmarks/openrouter",
      createOpenRouterBenchmarkSyncRouter(services.openRouterBenchmarkSync),
    );

    app.get("/benchmarks/openrouter/models", async (req, res) => {
      try {
        const workspaceRoot = getWorkspaceRoot();
        const storagePath = resolveStoragePath(workspaceRoot, env.STORAGE_PATH);

        const configuredModels = await opts.dataSource.getModels();
        const configuredModelNames = configuredModels
          .map((item) => {
            const name = item.modelName ?? "";
            const idx = name.indexOf(":");
            return idx > 0 ? name.slice(0, idx) : name;
          })
          .filter((name): name is string => Boolean(name));

        const aliases = await loadModelAliases(storagePath);
        const { configuredLookup, configuredCompacts } =
          buildConfiguredModelLookups(configuredModelNames, aliases);

        let mapped: ModelBenchmarkListItem[] = [];
        let matchedConfigs = new Set<string>();
        let source = "OpenRouter";
        let sourceUrl = "https://openrouter.ai/";
        let fetchedAt = "";

        try {
          const repo = createBenchmarksRepository();
          const allDbModels = await repo.getAll();
          const dbModels = allDbModels.filter((m) => m.source === "openrouter");
          if (dbModels.length > 0) {
            const result = mapConfiguredBenchmarkModels(
              dbModels,
              configuredLookup,
              configuredCompacts,
            );
            mapped = result.mapped;
            matchedConfigs = result.matchedConfigs;
          }
        } catch (error) {
          console.error(
            "Failed to load OpenRouter benchmarks from database, falling back to JSON:",
            error,
          );
        }

        if (mapped.length === 0) {
          const benchmarkFilePath = path.join(
            storagePath,
            "benchmarks",
            "openrouter-benchmarks.json",
          );
          const dataset = await loadBenchmarkDataset(benchmarkFilePath);
          const result = mapConfiguredBenchmarkModels(
            dataset.models,
            configuredLookup,
            configuredCompacts,
          );
          mapped = result.mapped;
          matchedConfigs = result.matchedConfigs;
          source = dataset.source;
          sourceUrl = dataset.sourceUrl;
          fetchedAt = dataset.fetchedAt;
        }

        const filters = parseBenchmarkFilterParams(req);
        const sort = parseBenchmarkSortParams(req);
        const { page, pageSize } = parseBenchmarkPaginationQuery(req);

        const filtered = applyBenchmarkFilters(mapped, filters);
        const sorted = applyBenchmarkSort(filtered, sort);
        const { items, total, totalPages } = paginateBenchmarkModels(
          sorted,
          page,
          pageSize,
        );

        const unmatchedConfiguredModels = configuredModelNames.filter(
          (name) => !matchedConfigs.has(name),
        );

        const response: ModelBenchmarkApiResponse = {
          source,
          sourceUrl,
          fetchedAt,
          count: total,
          configuredModelNames,
          unmatchedConfiguredModels,
          models: items,
          pagination: buildPaginationMetadata(
            total,
            page,
            pageSize,
            totalPages,
          ),
        };

        res.json(response);
      } catch (error) {
        const message = String(error);
        if (message.includes("ENOENT")) {
          res.status(404).json({
            error:
              "OpenRouter benchmark data not found. Trigger a sync from the UI.",
            code: "OPENROUTER_BENCHMARK_DATASET_MISSING",
          });
          return;
        }
        res.status(500).json({ error: message });
      }
    });
  }

  registerAllRoutes(app, opts);
  unregisterLegacyMutationRoutes(app);

  const healthCheckService = createHealthCheckApplicationService();
  app.use("/health-check", createHealthCheckRouter(healthCheckService));

  return app;
}
