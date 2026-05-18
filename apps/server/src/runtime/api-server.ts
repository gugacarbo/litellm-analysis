import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type {
  ModelBenchmarkApiResponse,
  ModelBenchmarkListItem,
  StoredModelBenchmarkDataset,
} from "@lite-llm/contracts/benchmarks";
import { registerAllRoutes } from "@lite-llm/server/routes";
import type { RouteOptions } from "@lite-llm/server/types";
import express, { type Application } from "express";
import { createHealthCheckApplicationService } from "../application/health-check-application-service";
import { createMonitorApplicationService } from "../application/monitor-application-service";
import type { AppContext } from "../contexts";
import { env } from "../env";
import { createHealthCheckRouter } from "../routes/health-check-routes";
import { createMonitorRouter } from "../routes/monitor-routes";

const execFileAsync = promisify(execFile);
const BENCHMARK_TTL_MS = 15 * 24 * 60 * 60 * 1000;
let benchmarkSyncInFlight: Promise<void> | null = null;

function findWorkspaceRoot(startDir: string): string {
  let current = startDir;
  const root = path.parse(current).root;

  while (current !== root) {
    const marker = path.join(current, "pnpm-workspace.yaml");
    if (existsSync(marker)) return current;
    current = path.dirname(current);
  }

  return startDir;
}

function getWorkspaceRoot(): string {
  const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
  return findWorkspaceRoot(runtimeDir);
}

function parseBooleanQuery(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

function toMatchKeys(value: string): string[] {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return [];

  const lastSegment = trimmed.includes("/")
    ? (trimmed.split("/").at(-1) ?? trimmed)
    : trimmed;
  const compact = trimmed.replace(/[^a-z0-9]/g, "");
  const compactSegment = lastSegment.replace(/[^a-z0-9]/g, "");

  return Array.from(new Set([trimmed, lastSegment, compact, compactSegment]));
}

/**
 * Extract a pure alphanumeric compact key from a string.
 */
function toCompactKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

interface ModelAliases {
  aliases: Record<string, string>;
}

function resolveStoragePath(workspaceRoot: string): string {
  if (path.isAbsolute(env.STORAGE_PATH)) {
    return env.STORAGE_PATH;
  }
  return path.join(workspaceRoot, env.STORAGE_PATH);
}

async function loadModelAliases(
  workspaceRoot: string,
): Promise<Record<string, string>> {
  const storagePath = resolveStoragePath(workspaceRoot);
  const aliasesPath = path.join(
    storagePath,
    "benchmarks",
    "model-aliases.json",
  );
  try {
    const raw = await readFile(aliasesPath, "utf8");
    const parsed = JSON.parse(raw) as ModelAliases;
    return parsed.aliases ?? {};
  } catch {
    return {};
  }
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

async function isBenchmarkFileFresh(filePath: string): Promise<boolean> {
  try {
    const metadata = await stat(filePath);
    const ageMs = Date.now() - metadata.mtimeMs;
    return ageMs <= BENCHMARK_TTL_MS;
  } catch {
    return false;
  }
}

async function runBenchmarksSync(workspaceRoot: string): Promise<void> {
  const args = ["sync:aa-benchmarks", "--force-refresh"];
  await execFileAsync("pnpm", args, {
    cwd: workspaceRoot,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function ensureBenchmarksReady(
  workspaceRoot: string,
  benchmarkFilePath: string,
): Promise<void> {
  if (benchmarkSyncInFlight) {
    return benchmarkSyncInFlight;
  }

  benchmarkSyncInFlight = (async () => {
    const isFresh = await isBenchmarkFileFresh(benchmarkFilePath);
    if (isFresh) return;
    await runBenchmarksSync(workspaceRoot);
  })().finally(() => {
    benchmarkSyncInFlight = null;
  });

  return benchmarkSyncInFlight;
}

async function loadBenchmarkDataset(
  workspaceRoot: string,
  benchmarkFilePath: string,
): Promise<StoredModelBenchmarkDataset> {
  const hasLocalData = existsSync(benchmarkFilePath);

  if (!hasLocalData) {
    await ensureBenchmarksReady(workspaceRoot, benchmarkFilePath);
  } else {
    void ensureBenchmarksReady(workspaceRoot, benchmarkFilePath).catch(
      (error) => {
        console.error("Failed to refresh benchmark dataset:", error);
      },
    );
  }

  const raw = await readFile(benchmarkFilePath, "utf8");
  return JSON.parse(raw) as StoredModelBenchmarkDataset;
}

export function createApiServer(
  opts: RouteOptions,
  ctx: AppContext,
): Application {
  const app = express();
  app.use(express.json());

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
      const configuredOnly = parseBooleanQuery(req.query.configuredOnly, false);
      const workspaceRoot = getWorkspaceRoot();
      const storagePath = resolveStoragePath(workspaceRoot);
      const benchmarkFilePath = path.join(
        storagePath,
        "benchmarks",
        "artificial-analysis-models.json",
      );
      const dataset = await loadBenchmarkDataset(
        workspaceRoot,
        benchmarkFilePath,
      );

      const configuredModels = await opts.dataSource.getModels();
      // Strip backend suffix (e.g. "glm-5.1:ollama" -> "glm-5.1") for matching
      const configuredModelNames = configuredModels
        .map((item) => {
          const name = item.modelName ?? "";
          const idx = name.indexOf(":");
          return idx > 0 ? name.slice(0, idx) : name;
        })
        .filter((name): name is string => Boolean(name));

      // Build lookup from configured model names (exact match)
      const configuredLookup = new Map<string, string>();
      for (const configured of configuredModelNames) {
        for (const key of toMatchKeys(configured)) {
          if (!configuredLookup.has(key)) {
            configuredLookup.set(key, configured);
          }
        }
      }

      // Load and apply manual aliases (user-defined overrides)
      const aliases = await loadModelAliases(workspaceRoot);
      for (const [configuredName, aaReference] of Object.entries(aliases)) {
        for (const key of toMatchKeys(aaReference)) {
          if (!configuredLookup.has(key)) {
            configuredLookup.set(key, configuredName);
          }
        }
      }

      // Build compact index for suffix-tolerant fallback matching
      const configuredCompacts = new Map<string, string>();
      for (const name of configuredModelNames) {
        configuredCompacts.set(toCompactKey(name), name);
      }

      const matchedConfigs = new Set<string>();
      const mapped: ModelBenchmarkListItem[] = dataset.models.map((model) => {
        const candidateKeys = [
          ...toMatchKeys(model.name),
          ...(model.slug ? toMatchKeys(model.slug) : []),
        ];
        const matched = candidateKeys.find((key) => configuredLookup.has(key));
        let matchedConfiguredModel = matched
          ? (configuredLookup.get(matched) ?? null)
          : null;

        // Fallback: suffix-tolerant matching for unmatched models
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

      // Report configured models that found NO match in the benchmark dataset
      const unmatchedConfiguredModels = configuredModelNames.filter(
        (name) => !matchedConfigs.has(name),
      );

      const models = configuredOnly
        ? mapped.filter((item) => item.isConfigured)
        : mapped;

      const response: ModelBenchmarkApiResponse = {
        source: dataset.source,
        sourceUrl: dataset.sourceUrl,
        fetchedAt: dataset.fetchedAt,
        count: models.length,
        configuredModelNames,
        unmatchedConfiguredModels,
        models,
      };

      res.json(response);
    } catch (error) {
      const message = String(error);
      if (message.includes("ENOENT")) {
        res.status(404).json({
          error:
            "Benchmark data file not found. Automatic sync was attempted but no local dataset is available.",
        });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  function getAliasesFilePath(workspaceRoot: string): string {
    const storagePath = resolveStoragePath(workspaceRoot);
    return path.join(storagePath, "benchmarks", "model-aliases.json");
  }

  // Get current aliases
  app.get("/benchmarks/aliases", async (_req, res) => {
    try {
      const workspaceRoot = getWorkspaceRoot();
      const aliases = await loadModelAliases(workspaceRoot);
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

  const workspaceRoot = getWorkspaceRoot();
  const storagePath = resolveStoragePath(workspaceRoot);
  const benchmarkFilePath = path.join(
    storagePath,
    "benchmarks",
    "artificial-analysis-models.json",
  );
  void ensureBenchmarksReady(workspaceRoot, benchmarkFilePath).catch(
    (error) => {
      console.error("Failed to warm benchmark dataset:", error);
    },
  );

  registerAllRoutes(app, opts);

  const monitorService = createMonitorApplicationService();
  app.use("/monitor", createMonitorRouter(monitorService));

  const healthCheckService = createHealthCheckApplicationService();
  app.use("/health-check", createHealthCheckRouter(healthCheckService));

  return app;
}
