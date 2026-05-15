import type { Server as HttpServer } from "node:http";
import { HealthCheckService } from "@lite-llm/monitor";
import type { AppContext } from "../contexts";
import type { WebSocketServer } from "../ws/websocket-server";

interface HealthCheckRuntimeOptions {
  ctx: AppContext;
  httpServer: HttpServer;
  wsServer: WebSocketServer;
  pollIntervalMs: number;
  timeoutMs: number;
  prompt: string;
  maxConcurrency: number;
  litellmApiUrl: string;
  litellmApiKey: string;
  enabledModelNames?: string[];
}

export interface HealthCheckRuntime {
  healthCheckService: HealthCheckService;
  start: () => void;
  stop: () => void;
}

export function createHealthCheckRuntime(
  options: HealthCheckRuntimeOptions,
): HealthCheckRuntime {
  const healthCheckService = new HealthCheckService({
    pollIntervalMs: options.pollIntervalMs,
    timeoutMs: options.timeoutMs,
    prompt: options.prompt,
    maxConcurrency: options.maxConcurrency,
    litellmApiUrl: options.litellmApiUrl,
    litellmApiKey: options.litellmApiKey,
    analyticsDataSource: options.ctx.analytics.dataSource,
    monitorDb: options.ctx.monitor.monitorDb,
    enabledModelNames: options.enabledModelNames,
  });

  healthCheckService.on("health_check_update", (data) => {
    options.wsServer.broadcast({
      type: "health_check_update",
      data,
    });
  });

  return {
    healthCheckService,
    start() {
      healthCheckService.start();
    },
    stop() {
      healthCheckService.stop();
    },
  };
}
