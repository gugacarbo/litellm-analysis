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

  healthCheckService.on("health_check_stream_started", (data) => {
    options.wsServer.broadcast({
      type: "health_check_stream_started",
      data,
    });
  });

  healthCheckService.on("health_check_stream_delta", (data) => {
    options.wsServer.broadcast({
      type: "health_check_stream_delta",
      data,
    });
  });

  healthCheckService.on("health_check_stream_completed", (data) => {
    options.wsServer.broadcast({
      type: "health_check_stream_completed",
      data,
    });
  });

  healthCheckService.on("health_check_stream_failed", (data) => {
    options.wsServer.broadcast({
      type: "health_check_stream_failed",
      data,
    });
  });

  options.wsServer.onClientMessage(async (ws, message) => {
    if (message.type !== "request_health_check") {
      return;
    }

    const modelName = (message.data as { modelName?: unknown })?.modelName;
    if (typeof modelName !== "string" || !modelName.trim()) {
      return;
    }

    const result = await healthCheckService.requestCheck(modelName);
    if (!result.accepted) {
      options.wsServer.sendTo(ws, {
        type: "health_check_rejected",
        data: {
          modelName,
          reason: result.reason ?? "unknown",
          timestamp: Date.now(),
        },
      });
    }
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
