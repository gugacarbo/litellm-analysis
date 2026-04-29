import { getErrorLogs } from "../queries/index.js";
import type { ErrorLogEntry } from "../types/index.js";

export async function getErrorLogsImpl(
  limit: number,
  days = 30,
): Promise<ErrorLogEntry[]> {
  const result = await getErrorLogs(limit, days);
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
