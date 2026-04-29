import * as path from "node:path";
import { createAgentsManager } from "@lite-llm/agents-manager";
import { createDataSource } from "@lite-llm/analytics/data-source";
import { createOrchestrationServices } from "@lite-llm/server-core/orchestration";
import { createApiServer } from "../api-server";
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

  const port = Number(process.env.PORT || 3000);
  const httpServer = app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
    console.log(`Config files location: ${path.join(projectRoot, "data")}`);
  });

  const monitorRuntime: MonitorRuntime = createMonitorRuntime({
    analyticsDataSource: dataSource,
    httpServer,
    pollIntervalMs: Number(process.env.MONITOR_POLL_INTERVAL_MS) || 15_000,
  });
  monitorRuntime.start();

  const stop = () => {
    console.log("\nShutting down gracefully...");
    monitorRuntime.stop();
    httpServer.close(() => process.exit(0));
  };

  registerShutdownHooks(stop);

  return { stop };
}
