import { toNullableNumber } from "../data-source/utils";
import type { ChatMessage } from "../types/index";
import type { ProxyRequestLog } from "../types/proxy-request-log";

function readRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is ChatMessage =>
      item != null &&
      typeof item === "object" &&
      typeof (item as ChatMessage).role === "string",
  );
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/** Maps LiteLLM_SpendLogs row to ProxyRequestLog for hybrid/compare paths. */
export function presentLitellmSpendLogAsProxy(
  row: Record<string, unknown>,
): ProxyRequestLog {
  const requestBody =
    readRecord(row.proxy_server_request) ?? readRecord(row.request_body);
  const responseBody =
    readRecord(row.response) ?? readRecord(row.response_body);
  const messages = readMessages(row.messages);
  const requestBodyMessages = readMessages(requestBody?.messages);
  const resolvedMessages = messages.length > 0 ? messages : requestBodyMessages;

  const cacheHit = row.cache_hit;
  let cachedTokens: number | null = toNullableNumber(row.cached_tokens);
  if (cachedTokens == null && cacheHit === "true") {
    cachedTokens = 1;
  } else if (cachedTokens == null && cacheHit === "false") {
    cachedTokens = 0;
  }

  const startTime = row.start_time ?? row.startTime;
  const endTime = row.end_time ?? row.endTime;

  return {
    id: readString(row.request_id ?? row.id),
    model: readString(row.model),
    upstream_model: readString(row.litellm_model_name ?? row.model),
    upstream_base_url: readString(row.api_base),
    status: readString(row.status),
    started_at: readString(startTime),
    finished_at: endTime != null && endTime !== "" ? readString(endTime) : null,
    latency_ms: toNullableNumber(row.request_duration_ms ?? row.latency_ms),
    ttft_ms: toNullableNumber(row.time_to_first_token_ms ?? row.ttft_ms),
    input_tokens: toNullableNumber(row.prompt_tokens ?? row.input_tokens),
    output_tokens: toNullableNumber(row.completion_tokens ?? row.output_tokens),
    total_tokens: toNullableNumber(row.total_tokens),
    cached_tokens: cachedTokens,
    reasoning_tokens: toNullableNumber(row.reasoning_tokens),
    usage_estimated: false,
    cost_estimated: false,
    input_cost_per_token: toNullableNumber(row.input_cost_per_token),
    output_cost_per_token: toNullableNumber(row.output_cost_per_token),
    input_cost: toNullableNumber(row.input_cost),
    output_cost: toNullableNumber(row.output_cost),
    total_cost: toNullableNumber(row.spend ?? row.total_cost) ?? 0,
    estimated_cost_usd: toNullableNumber(row.estimated_cost_usd),
    error_type: row.error_type != null ? readString(row.error_type) : null,
    error_message:
      row.error_message != null ? readString(row.error_message) : null,
    error_status_code: toNullableNumber(row.error_status_code),
    error_summary:
      row.error_summary != null ? readString(row.error_summary) : null,
    error_details: readRecord(row.error_details),
    request_body: requestBody,
    response_body: responseBody,
    response_headers: readRecord(row.response_headers) ?? undefined,
    messages: resolvedMessages,
  };
}
