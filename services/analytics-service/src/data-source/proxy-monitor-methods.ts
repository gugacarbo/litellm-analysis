import {
  getErrorCountByModelSince,
  getErrorsSince,
  getModelHealthSince,
  getNonSuccessCountByModelSince,
  getStuckRequests,
} from "../queries/proxy/monitor-queries";
import type { ErrorLogEntry, ModelHealth } from "../types/index";

interface RawErrorLog {
  id: unknown;
  error_type: unknown;
  model: unknown;
  error_message: unknown;
  timestamp: unknown;
  status_code: unknown;
  litellm_model_name: unknown;
  request_kwargs: unknown;
  spend_status: unknown;
  total_tokens: unknown;
  prompt_tokens: unknown;
  completion_tokens: unknown;
  spend: unknown;
  end_time: unknown;
}

function mapErrorRow(item: RawErrorLog): ErrorLogEntry {
  return {
    id: String(item.id ?? ""),
    error_type: String(item.error_type ?? ""),
    model: String(item.model ?? ""),
    user: null,
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
    api_key: null,
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
  };
}

export async function getProxyErrorsSinceImpl(
  since: Date,
  limit = 100,
): Promise<ErrorLogEntry[]> {
  const result = (await getErrorsSince(
    since,
    limit,
  )) as unknown as RawErrorLog[];
  return result.map(mapErrorRow);
}

export async function getProxyErrorCountByModelSinceImpl(
  since: Date,
): Promise<{ model: string; error_count: number }[]> {
  const result = await getErrorCountByModelSince(since);
  return result.map((item) => ({
    model: String(item.model ?? ""),
    error_count: Number(item.error_count),
  }));
}

export async function getProxyNonSuccessCountByModelSinceImpl(
  since: Date,
): Promise<{ model: string; non_success_count: number }[]> {
  const result = await getNonSuccessCountByModelSince(since);
  return result.map((item) => ({
    model: String(item.model ?? ""),
    non_success_count: Number(item.non_success_count),
  }));
}

export async function getProxyModelHealthSinceImpl(
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

export async function getProxyStuckRequestsImpl(
  threshold: Date,
): Promise<
  { request_id: string; model: string | null; startTime: string | null }[]
> {
  const result = await getStuckRequests(threshold);
  return result.map((item) => ({
    request_id: String(item.request_id),
    model: item.model as string | null,
    startTime: item.startTime
      ? new Date(item.startTime as string | number | Date).toISOString()
      : null,
  }));
}
