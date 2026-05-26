export type HealthCheckStatus = "healthy" | "unhealthy" | "error" | "unknown";

export interface HealthCheckResultEntry {
  id: number;
  modelName: string;
  status: HealthCheckStatus;
  responseTimeMs: number | null;
  ttftMs: number | null;
  outputTokens: number | null;
  tokensPerSecond: number | null;
  statusCode: number | null;
  promptSent: string | null;
  responseReceived: string | null;
  requestPayload: string | null;
  responsePayload: string | null;
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
  type: "health_check_result";
  data: HealthCheckResultEntry;
}
