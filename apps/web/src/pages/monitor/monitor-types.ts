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

export type ModelHealthStatus = "healthy" | "degraded" | "offline" | "unknown";

export interface ModelHealthEntry {
  model: string;
  status: ModelHealthStatus;
  last_error_at: string | null;
  error_rate_1h: number;
}

export interface WsMessage {
  type: "alert" | "health_update" | "connected";
  data: unknown;
}

export interface HealthUpdateData {
  models: ModelHealthEntry[];
  timestamp: number;
}
