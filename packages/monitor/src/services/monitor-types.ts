export type AnomalyType =
  | "model_offline"
  | "error_spike"
  | "timeout_stuck"
  | "silent_failure"
  | "spend_spike"
  | "low_throughput"
  | "non_success_spike";
export type AlertSeverity = "critical" | "warning" | "info";

export interface AnomalyAlert {
  anomaly_type: AnomalyType;
  model: string;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, unknown>;
  detected_at: number; // unix seconds
}

export interface DetectorInput {
  recentErrors: import("@lite-llm/analytics/types").ErrorLogEntry[];
  errorCountsByModel: { model: string; error_count: number }[];
  nonSuccessCountsByModel: {
    model: string;
    non_success_count: number;
  }[];
  stuckRequests: {
    request_id: string;
    model: string | null;
    startTime: string | null;
  }[];
  modelHealthMap: Map<string, ModelHealthStats>;
}

export interface DetectorResult {
  detected: boolean;
  alert?: Omit<AnomalyAlert, "detected_at">;
}

export type ModelHealthStatus = "healthy" | "degraded" | "offline" | "unknown";

export interface ModelHealthStats {
  total_requests: number;
  success_count: number;
  error_count: number;
  avg_latency_ms: number | null;
  last_success_at: string | null;
  last_error_at: string | null;
  p95_latency_ms: number | null;
}

export interface ModelHealthUpdate {
  model: string;
  status: ModelHealthStatus;
  last_error_at: string | null;
  error_rate_1h: number;
  stats: ModelHealthStats;
}

export interface MonitorServiceOptions {
  pollIntervalMs: number;
  analyticsDataSource: import("@lite-llm/analytics/data-source").AnalyticsDataSource;
  monitorDb: ReturnType<typeof import("../db/monitor-client").getMonitorDb>;
}

export type MonitorServiceEvents = {
  alert: (alert: AnomalyAlert) => void;
  health_update: (data: {
    models: ModelHealthUpdate[];
    timestamp: number;
  }) => void;
};
