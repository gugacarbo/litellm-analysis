import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type {
  ModelBenchmarkApiResponse,
  ModelBenchmarkListItem,
  StoredModelBenchmarkDataset,
} from "@lite-llm/api-contracts/benchmarks";
import { registerAllRoutes } from "@lite-llm/server-core/routes";
import type { RouteOptions } from "@lite-llm/server-core/types";
import express, { type Application } from "express";
import { createHealthCheckApplicationService } from "../application/health-check-application-service";
import { createMonitorApplicationService } from "../application/monitor-application-service";
import type { AppContext } from "../contexts";
import { createHealthCheckRouter } from "../routes/health-check-routes";
import { createMonitorRouter } from "../routes/monitor-routes";

const execFileAsync = promisify(execFile);
const BENCHMARK_TTL_MS = 7 * 24 * 60 * 60 * 1000;
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
      const benchmarkFilePath = path.join(
        workspaceRoot,
        "data",
        "benchmarks",
        "artificial-analysis-models.json",
      );
      await ensureBenchmarksReady(workspaceRoot, benchmarkFilePath);
      const raw = await readFile(benchmarkFilePath, "utf8");
      const dataset = JSON.parse(raw) as StoredModelBenchmarkDataset;

      const configuredModels = await opts.dataSource.getModels();
      const configuredModelNames = configuredModels
        .map((item) => item.modelName)
        .filter((name): name is string => Boolean(name));

      const configuredLookup = new Map<string, string>();
      for (const configured of configuredModelNames) {
        for (const key of toMatchKeys(configured)) {
          if (!configuredLookup.has(key)) {
            configuredLookup.set(key, configured);
          }
        }
      }

      const mapped: ModelBenchmarkListItem[] = dataset.models.map((model) => {
        const candidateKeys = [
          ...toMatchKeys(model.name),
          ...(model.slug ? toMatchKeys(model.slug) : []),
        ];
        const matched = candidateKeys.find((key) => configuredLookup.has(key));
        const matchedConfiguredModel = matched
          ? (configuredLookup.get(matched) ?? null)
          : null;

        return {
          ...model,
          isConfigured: matchedConfiguredModel !== null,
          matchedConfiguredModel,
        };
      });

      const models = configuredOnly
        ? mapped.filter((item) => item.isConfigured)
        : mapped;

      const response: ModelBenchmarkApiResponse = {
        source: dataset.source,
        sourceUrl: dataset.sourceUrl,
        fetchedAt: dataset.fetchedAt,
        count: models.length,
        configuredModelNames,
        models,
      };

      res.json(response);
    } catch (error) {
      const message = String(error);
      if (message.includes("ENOENT")) {
        res.status(404).json({
          error: "Benchmark data file not found after sync attempt.",
        });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  const workspaceRoot = getWorkspaceRoot();
  const benchmarkFilePath = path.join(
    workspaceRoot,
    "data",
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
