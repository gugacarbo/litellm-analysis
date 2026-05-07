import { MonitorService } from "@lite-llm/monitor";
import { WebSocketServer } from "../ws/websocket-server";
export function createMonitorRuntime(options) {
  const wsServer = new WebSocketServer(options.httpServer);
  const monitorService = new MonitorService({
    pollIntervalMs: options.pollIntervalMs,
    analyticsDataSource: options.ctx.analytics.dataSource,
    monitorDb: options.ctx.monitor.monitorDb,
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
