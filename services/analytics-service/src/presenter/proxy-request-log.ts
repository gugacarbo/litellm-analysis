import type {
  ModelProxyMessage,
  ModelProxyRequest,
  ModelProxyUsageAdjustment,
} from "@lite-llm/database/schema/model-proxy";
import { toNullableNumber } from "../data-source/utils";
import type { ChatMessage } from "../types/index";
import type {
  ProxyRequestLog,
  ProxyRequestLogListItem,
} from "../types/proxy-request-log";
import {
  applyUsageAdjustmentTotals,
  sumUsageAdjustments,
} from "./usage-adjustments";

export type RequestWithMessages = ModelProxyRequest & {
  messages: ModelProxyMessage[];
  usageAdjustments?: ModelProxyUsageAdjustment[];
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
): Omit<
  ProxyRequestLog,
  "error_details" | "response_headers" | "messages" | "usage_adjustments"
> {
  const base = {
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
    api_key_alias: row.apiKeyAlias,
    end_user: row.endUser,
    error_type: row.errorType,
    error_message: row.errorMessage,
    error_status_code: row.errorStatusCode,
    error_summary: row.errorSummary,
    request_body: asJsonRecord(row.requestBody),
    response_body: asJsonRecord(row.responseBody),
  };

  const adjustments = row.usageAdjustments ?? [];
  if (adjustments.length === 0) {
    return { ...base, has_usage_adjustments: false };
  }

  const adjusted = applyUsageAdjustmentTotals(
    {
      input_tokens: base.input_tokens,
      output_tokens: base.output_tokens,
      total_tokens: base.total_tokens,
      total_cost: base.total_cost,
    },
    sumUsageAdjustments(adjustments),
  );

  return {
    ...base,
    input_tokens: adjusted.input_tokens,
    output_tokens: adjusted.output_tokens,
    total_tokens: adjusted.total_tokens,
    total_cost: adjusted.total_cost,
    has_usage_adjustments: adjusted.has_usage_adjustments,
  };
}

function presentUsageAdjustments(
  adjustments: ModelProxyUsageAdjustment[],
): ProxyRequestLog["usage_adjustments"] {
  return adjustments.map((row) => ({
    id: row.id,
    reason: row.reason,
    prompt_tokens_delta: row.promptTokensDelta,
    completion_tokens_delta: row.completionTokensDelta,
    total_cost_delta: row.totalCostDelta,
    note: row.note,
    created_at: row.createdAt.toISOString(),
  }));
}

export function presentProxyRequestLog(
  row: RequestWithMessages,
  options: PresentProxyRequestLogOptions = {},
): ProxyRequestLog {
  const base = presentBaseFields(row);
  const adjustments = row.usageAdjustments ?? [];
  const log: ProxyRequestLog = {
    ...base,
    messages: row.messages.map(presentMessage),
    usage_adjustments:
      adjustments.length > 0 ? presentUsageAdjustments(adjustments) : undefined,
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
