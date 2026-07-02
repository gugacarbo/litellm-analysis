type HealthCheckStatus = "healthy" | "unhealthy" | "error";

type HealthCheckSource = "scheduled" | "manual";

interface HealthCheckResult {
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

interface HealthCheckServiceOptions {
  timeoutMs: number;
  prompt: string;
  maxConcurrency: number;
  modelProxyBaseUrl: string;
  modelProxyApiKey: string;
  analyticsDataSource: import("@lite-llm/analytics-service/data-source").AnalyticsDataSource;
  enabledModelNames?: string[];
  requestModeByModelName?: Record<string, "chat" | "responses">;
}

type HealthCheckRequestResult = {
  accepted: boolean;
  reason?: string;
};

const COOLDOWN_MS = 5_000;

interface HealthCheckStreamStartedPayload {
  executionId: string;
  modelName: string;
  prompt: string;
  timestamp: number;
}

interface HealthCheckStreamDeltaPayload {
  executionId: string;
  modelName: string;
  delta: string;
  timestamp: number;
}

interface HealthCheckStreamTerminalPayload {
  executionId: string;
  modelName: string;
  result: HealthCheckResult;
  timestamp: number;
}

type HealthCheckServiceEvents = {
  health_check_update: (data: {
    results: HealthCheckResult[];
    timestamp: number;
  }) => void;
  health_check_rejected: (data: {
    modelName: string;
    reason: string;
    timestamp: number;
  }) => void;
  health_check_stream_started: (data: HealthCheckStreamStartedPayload) => void;
  health_check_stream_delta: (data: HealthCheckStreamDeltaPayload) => void;
  health_check_stream_completed: (
    data: HealthCheckStreamTerminalPayload,
  ) => void;
  health_check_stream_failed: (data: HealthCheckStreamTerminalPayload) => void;
};

interface HealthCheckSummary {
  healthy: number;
  unhealthy: number;
  error: number;
  total: number;
}
