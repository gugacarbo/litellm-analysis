type HealthCheckStatus = "healthy" | "unhealthy" | "error";

type HealthCheckSource = "scheduled" | "manual";

export interface HealthCheckResult {
  id: number;
  modelName: string;
  status: HealthCheckStatus;
  responseTimeMs: number | null;
  ttftMs: number | null;
  outputTokens: number | null;
  tokensPerSecond: number | null;
  statusCode: number | null;
  promptSent: string;
  responseReceived: string | null;
  requestPayload: string | null;
  responsePayload: string | null;
  errorMessage: string | null;
  source: HealthCheckSource;
  checkedAt: number;
}

export interface HealthCheckServiceOptions {
  timeoutMs: number;
  prompt: string;
  maxConcurrency: number;
  modelProxyBaseUrl: string;
  modelProxyApiKey: string;
  analyticsDataSource: import("@lite-llm/analytics-service/data-source").AnalyticsDataSource;
  enabledModelNames?: string[];
  requestModeByModelName?: Record<string, "chat" | "responses">;
}

export type HealthCheckRequestResult = {
  accepted: boolean;
  reason?: string;
};

export const COOLDOWN_MS = 5_000;

export interface HealthCheckStreamStartedPayload {
  executionId: string;
  modelName: string;
  prompt: string;
  timestamp: number;
}

export interface HealthCheckStreamDeltaPayload {
  executionId: string;
  modelName: string;
  delta: string;
  timestamp: number;
}

export interface HealthCheckStreamTerminalPayload {
  executionId: string;
  modelName: string;
  result: HealthCheckResult;
  timestamp: number;
}

export type HealthCheckServiceEvents = {
  health_check_update: (data: { results: HealthCheckResult[] }) => void;
  health_check_stream_started: (data: HealthCheckStreamStartedPayload) => void;
  health_check_stream_delta: (data: HealthCheckStreamDeltaPayload) => void;
  health_check_stream_completed: (
    data: HealthCheckStreamTerminalPayload,
  ) => void;
  health_check_stream_failed: (data: HealthCheckStreamTerminalPayload) => void;
};
