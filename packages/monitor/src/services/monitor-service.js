import { EventEmitter } from "node:events";
import { alerts } from "../db/monitor-schema";
import { runAllDetectors } from "./detectors";
export class MonitorService {
  options;
  emitter;
  timer = null;
  lastPollTimestamp;
  running = false;
  dataSourceAvailable = true;
  constructor(options) {
    this.options = options;
    this.emitter = new EventEmitter();
    this.lastPollTimestamp = new Date(Date.now() - options.pollIntervalMs);
  }
  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.tick(); // Run immediately
    this.timer = setInterval(() => this.tick(), this.options.pollIntervalMs);
  }
  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  isRunning() {
    return this.running;
  }
  isDataSourceAvailable() {
    return this.dataSourceAvailable;
  }
  on(event, listener) {
    this.emitter.on(event, listener);
  }
  async tick() {
    try {
      const { analyticsDataSource } = this.options;
      const now = new Date();
      const since = this.lastPollTimestamp;
      this.dataSourceAvailable = true;
      // Collect data from analytics
      const [
        recentErrors,
        errorCountsByModel,
        nonSuccessCountsByModel,
        stuckRequests,
      ] = await Promise.all([
        analyticsDataSource.getErrorsSince(since).catch((err) => {
          console.error(
            "[MonitorService] Failed to fetch errors since",
            since,
            err,
          );
          this.dataSourceAvailable = false;
          return [];
        }),
        analyticsDataSource.getErrorCountByModelSince(since).catch((err) => {
          console.error(
            "[MonitorService] Failed to fetch error counts by model since",
            since,
            err,
          );
          this.dataSourceAvailable = false;
          return [];
        }),
        analyticsDataSource
          .getNonSuccessCountByModelSince(since)
          .catch((err) => {
            console.error(
              "[MonitorService] Failed to fetch non-success counts by model since",
              since,
              err,
            );
            this.dataSourceAvailable = false;
            return [];
          }),
        analyticsDataSource.getStuckRequests(since).catch((err) => {
          console.error(
            "[MonitorService] Failed to fetch stuck requests since",
            since,
            err,
          );
          this.dataSourceAvailable = false;
          return [];
        }),
      ]);
      if (!this.dataSourceAvailable) {
        console.warn(
          "[MonitorService] Analytics data source unavailable — some data may be incomplete",
        );
      }
      // Build model health map
      const modelHealthMap = new Map();
      const models = [
        ...new Set([
          ...recentErrors
            .map((e) => e.model ?? e.litellm_model_name)
            .filter(Boolean),
          ...errorCountsByModel.map((e) => e.model),
          ...nonSuccessCountsByModel.map((e) => e.model),
        ]),
      ];
      for (const model of models) {
        const health = await analyticsDataSource
          .getModelHealthSince(model, new Date(now.getTime() - 3600000), 24)
          .catch((err) => {
            console.error(
              "[MonitorService] Failed to fetch health for model",
              model,
              err,
            );
            this.dataSourceAvailable = false;
            return null;
          });
        if (health) {
          modelHealthMap.set(model, {
            total_requests: health.total_requests,
            success_count: health.success_count,
            error_count: health.error_count,
            avg_latency_ms: health.avg_latency_ms,
            last_success_at: health.last_success_at,
            last_error_at: health.last_error_at,
            p95_latency_ms: health.p95_latency_ms,
          });
        }
      }
      // Run detectors
      const input = {
        recentErrors,
        errorCountsByModel,
        nonSuccessCountsByModel,
        stuckRequests,
        modelHealthMap,
      };
      const results = runAllDetectors(input);
      // Process results
      for (const result of results) {
        if (result.detected && result.alert) {
          const alert = {
            ...result.alert,
            detected_at: Math.floor(Date.now() / 1000),
          };
          // Insert alert to monitor DB
          this.options.monitorDb
            .insert(alerts)
            .values({
              anomalyType: alert.anomaly_type,
              model: alert.model,
              severity: alert.severity,
              message: alert.message,
              metadata: alert.metadata ? JSON.stringify(alert.metadata) : null,
              detectedAt: alert.detected_at,
              createdAt: alert.detected_at,
            })
            .run();
          this.emitter.emit("alert", alert);
        }
      }
      // Build health update
      const healthUpdates = models.map((model) => {
        const stats = modelHealthMap.get(model);
        const errorRate = stats
          ? (stats.error_count / Math.max(stats.total_requests, 1)) * 100
          : 0;
        let status = "unknown";
        if (stats && stats.total_requests > 0) {
          status =
            stats.error_count === 0
              ? "healthy"
              : stats.error_count > stats.total_requests * 0.5
                ? "offline"
                : "degraded";
        }
        return {
          model,
          status,
          last_error_at: stats?.last_error_at ?? null,
          error_rate_1h: errorRate,
          stats: stats ?? {
            total_requests: 0,
            success_count: 0,
            error_count: 0,
            avg_latency_ms: null,
            last_success_at: null,
            last_error_at: null,
            p95_latency_ms: null,
          },
        };
      });
      this.emitter.emit("health_update", {
        models: healthUpdates,
        timestamp: Date.now(),
      });
      this.lastPollTimestamp = now;
    } catch (err) {
      console.error("[MonitorService] Tick failed:", err);
    }
  }
}
