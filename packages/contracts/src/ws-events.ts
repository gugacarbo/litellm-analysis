export type HealthCheckStatus = "healthy" | "unhealthy" | "error";

export type HealthCheckSource = "scheduled" | "manual";

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

export interface SpendLogsChangedPayload {
  changedRequestIds?: string[];
  timestamp: number;
}

export type HealthCheckStreamEventType =
  | "health_check_stream_started"
  | "health_check_stream_delta"
  | "health_check_stream_completed"
  | "health_check_stream_failed";

export type SpendLogsChangedEventType = "spend_logs_changed";

export type AutomaticInteractionWsEventType =
  | HealthCheckStreamEventType
  | SpendLogsChangedEventType;

export type AutomaticInteractionWsMessage =
  | {
      type: "health_check_stream_started";
      data: HealthCheckStreamStartedPayload;
    }
  | {
      type: "health_check_stream_delta";
      data: HealthCheckStreamDeltaPayload;
    }
  | {
      type: "health_check_stream_completed";
      data: HealthCheckStreamTerminalPayload;
    }
  | {
      type: "health_check_stream_failed";
      data: HealthCheckStreamTerminalPayload;
    }
  | { type: "spend_logs_changed"; data: SpendLogsChangedPayload };
