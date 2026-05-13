import { getErrorLogs } from "../queries/index.js";
import type { ErrorLogEntry } from "../types/index.js";

interface RawErrorLog {
  id: unknown;
  error_type: unknown;
  model: unknown;
  user: unknown;
  error_message: unknown;
  timestamp: unknown;
  status_code: unknown;
  litellm_model_name: unknown;
  request_kwargs: unknown;
  api_key: unknown;
  spend_status: unknown;
  total_tokens: unknown;
  prompt_tokens: unknown;
  completion_tokens: unknown;
  spend: unknown;
  end_time: unknown;
}

export async function getErrorLogsImpl(
  limit: number,
  days = 30,
): Promise<ErrorLogEntry[]> {
  const result = (await getErrorLogs(limit, days)) as unknown as RawErrorLog[];
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
