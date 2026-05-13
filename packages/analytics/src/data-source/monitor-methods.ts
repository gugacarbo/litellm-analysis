import {
  getErrorCountByModelSince,
  getErrorsSince,
  getModelHealthSince,
  getStuckRequests,
} from "../queries/index.js";
import type { ErrorLogEntry, ModelHealth } from "../types/index.js";

export async function getErrorsSinceImpl(
  since: Date,
  limit = 100,
): Promise<ErrorLogEntry[]> {
  const result = (await getErrorsSince(since, limit)) as Array<
    Record<string, unknown>
  >;
  return result.map((item) => ({
    id: String(item.id ?? ""),
    error_type: String(item.error_type ?? ""),
    model: String(item.model ?? ""),
    user: String(item.user ?? ""),
    error_message: String(item.error_message ?? ""),
    timestamp: item.timestamp
      ? new Date(item.timestamp as string | number | Date).toISOString()
      : "",
    status_code: Number(item.status_code || 0),
    litellm_model_name: item.litellm_model_name
      ? String(item.litellm_model_name)
      : null,
    request_kwargs: item.request_kwargs
      ? (item.request_kwargs as Record<string, unknown>)
      : null,
    api_key: item.api_key ? String(item.api_key) : null,
    spend_status: item.spend_status ? String(item.spend_status) : null,
    total_tokens: item.total_tokens != null ? Number(item.total_tokens) : null,
    prompt_tokens:
      item.prompt_tokens != null ? Number(item.prompt_tokens) : null,
    completion_tokens:
      item.completion_tokens != null ? Number(item.completion_tokens) : null,
    spend: item.spend != null ? Number(item.spend) : null,
    end_time: item.end_time
      ? new Date(item.end_time as string | number | Date).toISOString()
      : null,
  }));
}

export async function getErrorCountByModelSinceImpl(
  since: Date,
): Promise<{ model: string; error_count: number }[]> {
  const result = await getErrorCountByModelSince(since);
  return result.map((item) => ({
    model: String(item.model ?? ""),
    error_count: Number(item.error_count),
  }));
}

export async function getModelHealthSinceImpl(
  model: string,
  since: Date,
  baselineHours: number,
): Promise<ModelHealth> {
  const rows = (await getModelHealthSince({
    model,
    since,
    baselineHours,
  })) as Array<Record<string, unknown>>;
  const row = rows[0];
  if (!row) {
    return {
      total_requests: 0,
      success_count: 0,
      error_count: 0,
      avg_latency_ms: null,
      last_success_at: null,
      last_error_at: null,
      p95_latency_ms: null,
    };
  }
  return {
    total_requests: Number(row.total_requests),
    success_count: Number(row.success_count),
    error_count: Number(row.error_count),
    avg_latency_ms:
      row.avg_latency_ms != null ? Number(row.avg_latency_ms) : null,
    last_success_at: row.last_success_at
      ? new Date(row.last_success_at as string).toISOString()
      : null,
    last_error_at: row.last_error_at
      ? new Date(row.last_error_at as string).toISOString()
      : null,
    p95_latency_ms:
      row.p95_latency_ms != null ? Number(row.p95_latency_ms) : null,
  };
}

export async function getStuckRequestsImpl(
  since: Date,
): Promise<
  { request_id: string; model: string | null; startTime: string | null }[]
> {
  const result = (await getStuckRequests(since)) as Array<
    Record<string, unknown>
  >;
  return result.map((item) => ({
    request_id: String(item.request_id),
    model: item.model as string | null,
    startTime: item.startTime
      ? new Date(item.startTime as string | number | Date).toISOString()
      : null,
  }));
}

/**
 * Get spend anomalies since timestamp
 */
export async function getSpendAnomaliesSinceImpl(
  since: Date,
  threshold = 10,
): Promise<
  {
    request_id: string;
    model: string;
    spend: number;
    total_tokens: number | null;
    start_time: string;
    status: string;
  }[]
> {
  const { getSpendAnomaliesSince } = await import("../queries/index.js");
  const result = await getSpendAnomaliesSince(since, threshold);
  return result.map((item) => ({
    request_id: String(item.request_id),
    model: String(item.model ?? ""),
    spend: Number(item.spend),
    total_tokens: item.total_tokens ?? null,
    start_time: item.start_time ? new Date(item.start_time).toISOString() : "",
    status: String(item.status ?? ""),
  }));
}

/**
 * Get spend aggregated by model since timestamp
 */
export async function getSpendByModelSinceImpl(since: Date): Promise<
  {
    model: string;
    total_spend: number;
    request_count: number;
    avg_spend: number;
  }[]
> {
  const { getSpendByModelSince } = await import("../queries/index.js");
  const result = await getSpendByModelSince(since);
  return result.map((item) => ({
    model: String(item.model ?? ""),
    total_spend: Number(item.total_spend),
    request_count: Number(item.request_count),
    avg_spend: Number(item.avg_spend),
  }));
}

/**
 * Get non-success logs since timestamp
 */
export async function getNonSuccessLogsSinceImpl(
  since: Date,
  limit = 500,
): Promise<
  {
    request_id: string;
    model: string;
    spend: number;
    status: string;
    start_time: string;
    end_time: string | null;
    error_message: string | null;
  }[]
> {
  const { getNonSuccessLogsSince } = await import("../queries/index.js");
  const result = await getNonSuccessLogsSince(since, limit);
  return result.map((item) => ({
    request_id: String(item.request_id),
    model: String(item.model ?? ""),
    spend: Number(item.spend),
    status: String(item.status ?? ""),
    start_time: item.start_time ? new Date(item.start_time).toISOString() : "",
    end_time: item.end_time ? new Date(item.end_time).toISOString() : null,
    error_message: item.error_message ?? null,
  }));
}

/**
 * Get count of non-success requests by model since timestamp
 */
export async function getNonSuccessCountByModelSinceImpl(since: Date): Promise<
  {
    model: string;
    non_success_count: number;
  }[]
> {
  const { getNonSuccessCountByModelSince } = await import(
    "../queries/index.js"
  );
  const result = await getNonSuccessCountByModelSince(since);
  return result.map((item) => ({
    model: String(item.model ?? ""),
    non_success_count: Number(item.non_success_count),
  }));
}

/**
 * Get low throughput requests since timestamp
 */
export async function getLowThroughputRequestsSinceImpl(
  since: Date,
  threshold = 10,
): Promise<
  {
    request_id: string;
    model: string;
    completion_tokens: number | null;
    tokens_per_second: number;
    start_time: string;
    end_time: string | null;
  }[]
> {
  const { getLowThroughputRequestsSince } = await import("../queries/index.js");
  const result = await getLowThroughputRequestsSince(since, threshold);
  return result.map((item) => ({
    request_id: String(item.request_id),
    model: String(item.model ?? ""),
    completion_tokens: item.completion_tokens ?? null,
    tokens_per_second: Number(item.tokens_per_second),
    start_time: item.start_time ? new Date(item.start_time).toISOString() : "",
    end_time: item.end_time ? new Date(item.end_time).toISOString() : null,
  }));
}
