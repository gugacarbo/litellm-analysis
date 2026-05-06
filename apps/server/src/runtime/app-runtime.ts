import * as path from "node:path";
import { createAgentsManager } from "@lite-llm/agents-manager";
import { createDataSource } from "@lite-llm/analytics/data-source";
import { closePool } from "@lite-llm/analytics/queries";
import { createOrchestrationServices } from "@lite-llm/server-core/orchestration";
import { env } from "../env";
import { createApiServer } from "./api-server";
import {
  createHealthCheckRuntime,
  type HealthCheckRuntime,
} from "./health-check-runtime";
import { createMonitorRuntime, type MonitorRuntime } from "./monitor-runtime";

export interface AppRuntime {
  stop: () => void;
}

function getProjectRoot(cwd: string): string {
  return path.resolve(cwd, "..", "..");
}

function setupAgentsManager(projectRoot: string): void {
  createAgentsManager({
    projectRoot,
    dbFile: path.join(projectRoot, "db", "db.json"),
    legacyConfigFile: path.join(projectRoot, "data", "oh-my-openagent.json"),
    providersFile: path.join(projectRoot, "data", "opencode.json"),
    vscodeModelsFile: path.join(projectRoot, "data", "vscode-oaicopilot.json"),
  });
}

function registerShutdownHooks(stop: () => void): void {
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

export function startAppRuntime(): AppRuntime {
  const projectRoot = getProjectRoot(process.cwd());
  setupAgentsManager(projectRoot);

  const dataSource = createDataSource();
  const orchestration = createOrchestrationServices(dataSource);

  const app = createApiServer({ dataSource, orchestration });

  const port = env.PORT;

  const httpServer = app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
    console.log(`Config files location: ${path.join(projectRoot, "data")}`);
  });

  const monitorRuntime: MonitorRuntime = createMonitorRuntime({
    analyticsDataSource: dataSource,
    httpServer,
    pollIntervalMs: env.MONITOR_POLL_INTERVAL_MS,
  });

  const healthCheckRuntime: HealthCheckRuntime = createHealthCheckRuntime({
    analyticsDataSource: dataSource,
    httpServer,
    wsServer: monitorRuntime.wsServer,
    pollIntervalMs: env.HEALTH_CHECK_INTERVAL_MS,
    timeoutMs: env.HEALTH_CHECK_TIMEOUT_MS,
    prompt: env.HEALTH_CHECK_PROMPT,
    maxConcurrency: 6,
    litellmApiUrl: env.LITELLM_API_URL,
    litellmApiKey: env.LITELLM_API_KEY,
  });

  app.post("/health-check/run", async (req, res) => {
    try {
      const { models } = (req.body as { models?: string[] }) ?? {};
      const modelList = models?.length ? models : undefined;
      await healthCheckRuntime.healthCheckService.runAllChecks(modelList);
      res.json({ triggered: true });
    } catch (_err) {
      res.status(500).json({ error: "Failed to trigger health check" });
    }
  });

  monitorRuntime.start();
  healthCheckRuntime.start();

  const stop = () => {
    console.log("\nShutting down gracefully...");
    healthCheckRuntime.stop();
    monitorRuntime.stop();
    httpServer.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  registerShutdownHooks(stop);

  return { stop };
}
