import { HealthCheckService } from "@lite-llm/monitor";
export function createHealthCheckRuntime(options) {
  const healthCheckService = new HealthCheckService({
    pollIntervalMs: options.pollIntervalMs,
    timeoutMs: options.timeoutMs,
    prompt: options.prompt,
    maxConcurrency: options.maxConcurrency,
    litellmApiUrl: options.litellmApiUrl,
    litellmApiKey: options.litellmApiKey,
    analyticsDataSource: options.ctx.analytics.dataSource,
    monitorDb: options.ctx.monitor.monitorDb,
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
