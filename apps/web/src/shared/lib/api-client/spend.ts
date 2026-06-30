import type {
  ChatMessage,
  PaginationMetadata,
} from "@lite-llm/contracts/analytics";
import type { AnalyticsQueryParams } from "./analytics";
import { fetchApi, withDateRange, withDays } from "./core";

/** Native proxy ledger contract (replaces deprecated SpendLog). */
export interface ProxyRequestLog {
  id: string;
  model: string;
  upstream_model: string;
  upstream_base_url: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  latency_ms: number | null;
  ttft_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cached_tokens: number | null;
  reasoning_tokens: number | null;
  usage_estimated: boolean;
  cost_estimated: boolean;
  input_cost_per_token: number | null;
  output_cost_per_token: number | null;
  input_cost: number | null;
  output_cost: number | null;
  total_cost: number | null;
  estimated_cost_usd: number | null;
  error_type: string | null;
  error_message: string | null;
  error_status_code: number | null;
  error_summary: string | null;
  error_details?: Record<string, unknown> | null;
  request_body: Record<string, unknown> | null;
  response_body: Record<string, unknown> | null;
  response_headers?: Record<string, unknown> | null;
  messages: ChatMessage[];
}

type RawSpendLogRecord = Record<string, unknown>;

function readNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ChatMessage =>
      item != null &&
      typeof item === "object" &&
      typeof (item as ChatMessage).role === "string",
  );
}

function readCachedTokens(raw: RawSpendLogRecord): number | null {
  const cached = readNumber(raw.cached_tokens);
  if (cached != null) return cached;

  const cacheHit = raw.cache_hit;
  if (cacheHit === "true") return 1;
  if (cacheHit === "false") return 0;
  return null;
}

/** Maps API payload (proxy or legacy LiteLLM) to native ProxyRequestLog. */
export function normalizeProxyRequestLog(
  raw: RawSpendLogRecord,
): ProxyRequestLog {
  const requestBody =
    readRecord(raw.request_body) ?? readRecord(raw.proxy_server_request);
  const responseBody =
    readRecord(raw.response_body) ?? readRecord(raw.response);

  const messages = readMessages(raw.messages);
  const requestBodyMessages = readMessages(requestBody?.messages);
  const resolvedMessages = messages.length > 0 ? messages : requestBodyMessages;

  return {
    id: readString(raw.id ?? raw.request_id),
    model: readString(raw.model),
    upstream_model: readString(
      raw.upstream_model ?? raw.litellm_model_name ?? raw.model,
    ),
    upstream_base_url: readString(raw.upstream_base_url ?? raw.api_base),
    status: readString(raw.status),
    started_at: readString(raw.started_at ?? raw.start_time),
    finished_at:
      raw.finished_at != null
        ? readString(raw.finished_at)
        : raw.end_time != null
          ? readString(raw.end_time)
          : null,
    latency_ms:
      readNumber(raw.latency_ms) ?? readNumber(raw.request_duration_ms),
    ttft_ms: readNumber(raw.ttft_ms) ?? readNumber(raw.time_to_first_token_ms),
    input_tokens: readNumber(raw.input_tokens) ?? readNumber(raw.prompt_tokens),
    output_tokens:
      readNumber(raw.output_tokens) ?? readNumber(raw.completion_tokens),
    total_tokens: readNumber(raw.total_tokens),
    cached_tokens: readCachedTokens(raw),
    reasoning_tokens: readNumber(raw.reasoning_tokens),
    usage_estimated: readBoolean(raw.usage_estimated),
    cost_estimated: readBoolean(raw.cost_estimated),
    input_cost_per_token: readNumber(raw.input_cost_per_token),
    output_cost_per_token: readNumber(raw.output_cost_per_token),
    input_cost: readNumber(raw.input_cost),
    output_cost: readNumber(raw.output_cost),
    total_cost: readNumber(raw.total_cost) ?? readNumber(raw.spend),
    estimated_cost_usd: readNumber(raw.estimated_cost_usd),
    error_type: raw.error_type != null ? readString(raw.error_type) : null,
    error_message:
      raw.error_message != null ? readString(raw.error_message) : null,
    error_status_code: readNumber(raw.error_status_code),
    error_summary:
      raw.error_summary != null ? readString(raw.error_summary) : null,
    error_details: readRecord(raw.error_details),
    request_body: requestBody,
    response_body: responseBody,
    response_headers: readRecord(raw.response_headers) ?? undefined,
    messages: resolvedMessages,
  };
}

function normalizeProxyRequestLogs(
  logs: RawSpendLogRecord[],
): ProxyRequestLog[] {
  return logs.map(normalizeProxyRequestLog);
}

function buildAnalyticsEndpoint(
  base: string,
  params: AnalyticsQueryParams,
): string {
  let endpoint = base;
  if (params.startDate || params.endDate) {
    endpoint = withDateRange(endpoint, {
      startDate: params.startDate,
      endDate: params.endDate,
    });
  } else if (params.days !== undefined) {
    endpoint = withDays(endpoint, params.days);
  }
  return endpoint;
}

export async function getSpendByModel(
  params: AnalyticsQueryParams = {},
): Promise<{ model: string; total_spend: number }[]> {
  return fetchApi(buildAnalyticsEndpoint("/spend/model", params));
}

export async function getSpendLogs(
  params: {
    model?: string;
    user?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  },
  options?: RequestInit,
): Promise<{ logs: ProxyRequestLog[]; pagination: PaginationMetadata }> {
  const searchParams = new URLSearchParams();
  if (params.model) searchParams.set("model", params.model);
  if (params.user) searchParams.set("user", params.user);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));

  const result = await fetchApi<{
    logs: RawSpendLogRecord[];
    pagination: PaginationMetadata;
  }>(`/spend/logs?${searchParams}`, options);

  return {
    logs: normalizeProxyRequestLogs(result.logs),
    pagination: result.pagination,
  };
}

export async function getSpendByUser(
  params: AnalyticsQueryParams = {},
): Promise<
  {
    user: string;
    total_spend: number;
    total_tokens: number;
    request_count: number;
  }[]
> {
  return fetchApi(buildAnalyticsEndpoint("/spend/user", params));
}

export async function getSpendLogDetail(
  requestId: string,
): Promise<ProxyRequestLog> {
  const raw = await fetchApi<RawSpendLogRecord>(
    `/spend/logs/${encodeURIComponent(requestId)}`,
  );
  return normalizeProxyRequestLog(raw);
}

export async function getDailySpendTrend(
  params: AnalyticsQueryParams = {},
): Promise<{ date: string; spend: number }[]> {
  if (params.startDate || params.endDate) {
    return fetchApi(buildAnalyticsEndpoint("/spend/trend", params));
  }
  const days = params.days ?? 30;
  return fetchApi(`/spend/trend?days=${days}`);
}
