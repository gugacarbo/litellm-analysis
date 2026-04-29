import type { Server as HttpServer } from "node:http";
import type { AnalyticsDataSource } from "@lite-llm/analytics/data-source";
import { getMonitorDb, MonitorService } from "@lite-llm/monitor";
import { WebSocketServer } from "../ws/websocket-server";

interface MonitorRuntimeOptions {
  analyticsDataSource: AnalyticsDataSource;
  httpServer: HttpServer;
  pollIntervalMs: number;
}

export interface MonitorRuntime {
  wsServer: WebSocketServer;
  monitorService: MonitorService;
  start: () => void;
  stop: () => void;
}

export function createMonitorRuntime(
  options: MonitorRuntimeOptions,
): MonitorRuntime {
  const wsServer = new WebSocketServer(options.httpServer);
  const monitorDb = getMonitorDb();
  const monitorService = new MonitorService({
    pollIntervalMs: options.pollIntervalMs,
    analyticsDataSource: options.analyticsDataSource,
    monitorDb,
  });

  monitorService.on("alert", (alert) => {
    wsServer.broadcast({ type: "alert", data: alert });
  });
  monitorService.on("health_update", (data) => {
    wsServer.broadcast({ type: "health_update", data });
  });

  return {
    wsServer,
    monitorService,
    start() {
      wsServer.start();
      monitorService.start();
    },
    stop() {
      monitorService.stop();
      wsServer.stop();
    },
  };
}
