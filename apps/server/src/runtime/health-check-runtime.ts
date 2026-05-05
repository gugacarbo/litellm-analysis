import type { Server as HttpServer } from "node:http";
import type { AnalyticsDataSource } from "@lite-llm/analytics/data-source";
import { getMonitorDb, HealthCheckService } from "@lite-llm/monitor";
import type { WebSocketServer } from "../ws/websocket-server";

interface HealthCheckRuntimeOptions {
  analyticsDataSource: AnalyticsDataSource;
  httpServer: HttpServer;
  wsServer: WebSocketServer;
  pollIntervalMs: number;
  timeoutMs: number;
  prompt: string;
  maxConcurrency: number;
  litellmApiUrl: string;
  litellmApiKey: string;
}

export interface HealthCheckRuntime {
  healthCheckService: HealthCheckService;
  start: () => void;
  stop: () => void;
}

export function createHealthCheckRuntime(
  options: HealthCheckRuntimeOptions,
): HealthCheckRuntime {
  const monitorDb = getMonitorDb();
  const healthCheckService = new HealthCheckService({
    pollIntervalMs: options.pollIntervalMs,
    timeoutMs: options.timeoutMs,
    prompt: options.prompt,
    maxConcurrency: options.maxConcurrency,
    litellmApiUrl: options.litellmApiUrl,
    litellmApiKey: options.litellmApiKey,
    analyticsDataSource: options.analyticsDataSource,
    monitorDb,
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
