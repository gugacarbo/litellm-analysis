import "dotenv/config";
import * as path from "node:path";
import { createAgentsManager } from "@lite-llm/agents-manager";
import { createDataSource } from "@lite-llm/analytics/data-source";
import { MonitorService, getMonitorDb } from "@lite-llm/monitor";
import { createOrchestrationServices } from "@lite-llm/server-core/orchestration";
import { createApiServer } from "./api-server.js";
import { WebSocketServer } from "./ws/websocket-server.js";

const projectRoot = path.resolve(process.cwd(), "..", "..");

createAgentsManager({
  dbFile: path.join(projectRoot, "db", "db.json"),
  legacyConfigFile: path.join(projectRoot, "data", "oh-my-openagent.json"),
  providersFile: path.join(projectRoot, "data", "opencode.json"),
  vscodeModelsFile: path.join(projectRoot, "data", "vscode-oaicopilot.json"),
});

const dataSource = createDataSource();
const orchestration = createOrchestrationServices(dataSource);
const app = createApiServer({ dataSource, orchestration });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log(`Config files location: ${path.join(projectRoot, "data")}`);
});

const wsServer = new WebSocketServer(server);
wsServer.start();

// Initialize MonitorService
const monitorDb = getMonitorDb();
const monitorService = new MonitorService({
  pollIntervalMs: Number(process.env.MONITOR_POLL_INTERVAL_MS) || 15_000,
  analyticsDataSource: dataSource,
  monitorDb,
});

// Wire events to WebSocket broadcast
monitorService.on("alert", (alert) => {
  wsServer.broadcast({ type: "alert", data: alert });
});
monitorService.on("health_update", (data) => {
  wsServer.broadcast({ type: "health_update", data });
});

monitorService.start();

const shutdown = () => {
  console.log("\nShutting down gracefully...");
  monitorService.stop();
  wsServer.stop();
  server.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
