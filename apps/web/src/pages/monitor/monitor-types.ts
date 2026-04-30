export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export type AnomalyType =
  | "model_offline"
  | "error_spike"
  | "timeout_stuck"
  | "silent_failure";
export type AlertSeverity = "critical" | "warning" | "info";

export interface MonitorAlert {
  id: number;
  anomalyType: string;
  model: string | null;
  severity: string;
  message: string;
  metadata: string | null;
  detectedAt: number;
  acknowledgedAt: number | null;
  createdAt: number;
}

export interface ErrorSpikeMetadata {
  recent_error_count_5min: number;
  baseline_hourly_rate: number;
  current_hourly_rate: number;
  spike_ratio: number;
}

export interface ModelOfflineMetadata {
  recent_failure_count: number;
  last_error_at: string;
  last_success_at: string | null;
}

export interface TimeoutStuckMetadata {
  stuck_request_count?: number;
  stuck_request_ids?: string[];
  p95_latency_ms: number;
  avg_latency_ms: number;
  latency_ratio?: number;
}

export interface SilentFailureMetadata {
  silent_failure_count: number;
  sample_errors: string[];
}

export type AlertMetadata =
  | ErrorSpikeMetadata
  | ModelOfflineMetadata
  | TimeoutStuckMetadata
  | SilentFailureMetadata;

export type ModelHealthStatus = "healthy" | "degraded" | "offline" | "unknown";

export interface ModelHealthStats {
  total_requests: number;
  success_count: number;
  error_count: number;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
  last_success_at: string | null;
  last_error_at: string | null;
}

export interface ModelHealthEntry {
  model: string;
  status: ModelHealthStatus;
  last_error_at: string | null;
  error_rate_1h: number;
  stats: ModelHealthStats | null;
}

export interface WsMessage {
  type: "alert" | "health_update" | "connected";
  data: unknown;
}

export interface HealthUpdateData {
  models: ModelHealthEntry[];
  timestamp: number;
}
