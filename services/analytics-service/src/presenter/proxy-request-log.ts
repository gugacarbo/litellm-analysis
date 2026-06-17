import type {
  ModelProxyMessage,
  ModelProxyRequest,
} from "@lite-llm/model-proxy-repository";
import { toNullableNumber } from "../data-source/utils";
import type { ChatMessage } from "../types/index";
import type {
  ProxyRequestLog,
  ProxyRequestLogListItem,
} from "../types/proxy-request-log";

type RequestWithMessages = ModelProxyRequest & {
  messages: ModelProxyMessage[];
};

export interface PresentProxyRequestLogOptions {
  includeDetailFields?: boolean;
}

function asJsonRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function presentMessage(message: ModelProxyMessage): ChatMessage {
  return {
    role: message.role,
    content: message.content as ChatMessage["content"],
  };
}

function presentBaseFields(
  row: RequestWithMessages,
): Omit<ProxyRequestLog, "error_details" | "response_headers" | "messages"> {
  return {
    id: row.id,
    model: row.model,
    upstream_model: row.upstreamModel,
    upstream_base_url: row.upstreamBaseUrl,
    status: row.status,
    started_at: row.startedAt.toISOString(),
    finished_at: row.finishedAt ? row.finishedAt.toISOString() : null,
    latency_ms: row.latencyMs,
    ttft_ms: row.ttftMs,
    input_tokens: row.inputTokens,
    output_tokens: row.outputTokens,
    total_tokens: row.totalTokens,
    cached_tokens: row.cachedTokens,
    reasoning_tokens: row.reasoningTokens,
    usage_estimated: row.usageEstimated ?? false,
    cost_estimated: row.costEstimated ?? false,
    input_cost_per_token: toNullableNumber(row.inputCostPerToken),
    output_cost_per_token: toNullableNumber(row.outputCostPerToken),
    input_cost: toNullableNumber(row.inputCost),
    output_cost: toNullableNumber(row.outputCost),
    total_cost: toNullableNumber(row.totalCost),
    estimated_cost_usd: toNullableNumber(row.estimatedCostUsd),
    error_type: row.errorType,
    error_message: row.errorMessage,
    error_status_code: row.errorStatusCode,
    error_summary: row.errorSummary,
    request_body: asJsonRecord(row.requestBody),
    response_body: asJsonRecord(row.responseBody),
  };
}

export function presentProxyRequestLog(
  row: RequestWithMessages,
  options: PresentProxyRequestLogOptions = {},
): ProxyRequestLog {
  const base = presentBaseFields(row);
  const log: ProxyRequestLog = {
    ...base,
    messages: row.messages.map(presentMessage),
  };

  if (options.includeDetailFields) {
    log.error_details = asJsonRecord(row.errorDetails);
    log.response_headers = asJsonRecord(row.responseHeaders);
  }

  return log;
}

export function presentProxyRequestLogListItem(
  row: RequestWithMessages,
): ProxyRequestLogListItem {
  return {
    ...presentBaseFields(row),
    messages: row.messages.map(presentMessage),
  };
}
