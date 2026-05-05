export type HealthCheckStatus = "healthy" | "unhealthy" | "error" | "unknown";

export interface HealthCheckResultEntry {
  id: number;
  modelName: string;
  status: HealthCheckStatus;
  responseTimeMs: number | null;
  statusCode: number | null;
  promptSent: string;
  responseReceived: string | null;
  errorMessage: string | null;
  source: "scheduled" | "manual";
  checkedAt: number;
}

export interface HealthCheckSummaryData {
  healthy: number;
  unhealthy: number;
  error: number;
  total: number;
}

export interface HealthCheckUpdatePayload {
  results: HealthCheckResultEntry[];
  timestamp: number;
}

export type ConnectionState =
  | "connected"
  | "connecting"
  | "reconnecting"
  | "disconnected";

export interface HealthCheckWsMessage {
  type: "health_check_update" | "connected";
  data: unknown;
}
