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
  }));
}
