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
  const result = await getErrorsSince(since, limit);
  return result.map((item) => ({
    id: item.id,
    error_type: String(item.error_type ?? ""),
    model: String(item.model ?? ""),
    user: String(item.user ?? ""),
    error_message: String(item.error_message ?? ""),
    timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : "",
    status_code: item.status_code || 0,
    litellm_model_name: item.litellm_model_name
      ? String(item.litellm_model_name)
      : null,
    request_kwargs: item.request_kwargs
      ? (item.request_kwargs as Record<string, unknown>)
      : null,
    api_key: item.api_key ? String(item.api_key) : null,
    spend_status: item.spend_status ? String(item.spend_status) : null,
    total_tokens: item.total_tokens ?? null,
    prompt_tokens: item.prompt_tokens ?? null,
    completion_tokens: item.completion_tokens ?? null,
    spend: item.spend ?? null,
    end_time: item.end_time ? new Date(item.end_time).toISOString() : null,
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
  const rows = await getModelHealthSince({ model, since, baselineHours });
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
    avg_latency_ms: row.avg_latency_ms,
    last_success_at: row.last_success_at
      ? new Date(row.last_success_at).toISOString()
      : null,
    last_error_at: row.last_error_at
      ? new Date(row.last_error_at).toISOString()
      : null,
    p95_latency_ms: row.p95_latency_ms,
  };
}

export async function getStuckRequestsImpl(
  since: Date,
): Promise<
  { request_id: string; model: string | null; startTime: string | null }[]
> {
  const result = await getStuckRequests(since);
  return result.map((item) => ({
    request_id: String(item.request_id),
    model: item.model,
    startTime: item.startTime ? new Date(item.startTime).toISOString() : null,
  }));
}
