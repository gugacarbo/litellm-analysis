import { EventEmitter } from "node:events";
import type { ErrorLogEntry, ModelHealth } from "@lite-llm/analytics/types";
import { alerts } from "../db/monitor-schema";
import { runAllDetectors } from "./detectors";
import type {
  AnomalyAlert,
  DetectorInput,
  ModelHealthStats,
  ModelHealthStatus,
  ModelHealthUpdate,
  MonitorServiceEvents,
  MonitorServiceOptions,
} from "./monitor-types";

export class MonitorService {
  private options: MonitorServiceOptions;
  private emitter: EventEmitter;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastPollTimestamp: Date;
  private running = false;

  constructor(options: MonitorServiceOptions) {
    this.options = options;
    this.emitter = new EventEmitter();
    this.lastPollTimestamp = new Date(Date.now() - options.pollIntervalMs);
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.tick(); // Run immediately
    this.timer = setInterval(() => this.tick(), this.options.pollIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  on<K extends keyof MonitorServiceEvents>(
    event: K,
    listener: MonitorServiceEvents[K],
  ): void {
    this.emitter.on(event, listener as (...args: unknown[]) => void);
  }

  private async tick(): Promise<void> {
    try {
      const { analyticsDataSource } = this.options;
      const now = new Date();
      const since = this.lastPollTimestamp;

      // Collect data from analytics
      const [
        recentErrors,
        errorCountsByModel,
        nonSuccessCountsByModel,
        stuckRequests,
      ] = await Promise.all([
        analyticsDataSource
          .getErrorsSince(since)
          .catch(() => [] as ErrorLogEntry[]),
        analyticsDataSource
          .getErrorCountByModelSince(since)
          .catch(() => [] as { model: string; error_count: number }[]),
        analyticsDataSource
          .getNonSuccessCountByModelSince(since)
          .catch(() => [] as { model: string; non_success_count: number }[]),
        analyticsDataSource.getStuckRequests(since).catch(
          () =>
            [] as {
              request_id: string;
              model: string | null;
              startTime: string | null;
            }[],
        ),
      ]);

      // Build model health map
      const modelHealthMap = new Map<string, ModelHealthStats>();
      const models = [
        ...new Set([
          ...(recentErrors
            .map((e) => e.model ?? e.litellm_model_name)
            .filter(Boolean) as string[]),
          ...errorCountsByModel.map((e) => e.model),
          ...nonSuccessCountsByModel.map((e) => e.model),
        ]),
      ];

      for (const model of models) {
        const health = await analyticsDataSource
          .getModelHealthSince(model, new Date(now.getTime() - 3600000), 24)
          .catch(() => null as ModelHealth | null);
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
      const input: DetectorInput = {
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
          const alert: AnomalyAlert = {
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
      const healthUpdates: ModelHealthUpdate[] = models.map((model) => {
        const stats = modelHealthMap.get(model);
        const errorRate = stats
          ? (stats.error_count / Math.max(stats.total_requests, 1)) * 100
          : 0;
        let status: ModelHealthStatus = "unknown";
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

// Re-export for external consumers
export type { MonitorServiceEvents } from "./monitor-types";
