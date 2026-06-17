import {
  presentProxyRequestLog,
  presentProxyRequestLogListItem,
} from "../presenter/proxy-request-log";
import {
  getSpendLogDetail,
  getSpendLogs,
  getSpendLogsCount,
} from "../queries/proxy/spend-queries";
import type {
  ChatMessage,
  SpendLogEntry,
  SpendLogsFilters,
  SpendLogsResponse,
} from "../types/index";
import type { ProxyRequestLog } from "../types/proxy-request-log";

function proxyRequestLogToSpendLogEntry(log: ProxyRequestLog): SpendLogEntry {
  return {
    request_id: log.id,
    model: log.model,
    user: null,
    total_tokens: log.total_tokens,
    prompt_tokens: log.input_tokens,
    completion_tokens: log.output_tokens,
    spend: log.total_cost ?? 0,
    time_to_first_token_ms: log.ttft_ms,
    start_time: log.started_at,
    end_time: log.finished_at,
    api_key: null,
    status: log.status,
    api_base: log.upstream_base_url,
    request_duration_ms: log.latency_ms,
    messages: log.messages as ChatMessage[],
  };
}

export async function getProxySpendLogsCountImpl(
  filters: SpendLogsFilters,
): Promise<number> {
  return getSpendLogsCount({
    model: filters.model,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
}

export async function getProxySpendLogsImpl(
  filters: SpendLogsFilters,
  getSpendLogsCountFn: (filters: SpendLogsFilters) => Promise<number>,
): Promise<SpendLogsResponse> {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [rows, total] = await Promise.all([
    getSpendLogs({
      model: filters.model,
      startDate: filters.startDate,
      endDate: filters.endDate,
      limit,
      offset,
    }),
    getSpendLogsCountFn(filters),
  ]);

  const logs = rows.map((row) =>
    proxyRequestLogToSpendLogEntry(presentProxyRequestLogListItem(row)),
  );

  return {
    logs,
    pagination: {
      total,
      page: Math.floor(offset / limit) + 1,
      page_size: limit,
      total_pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function getProxySpendLogDetailImpl(
  requestId: string,
): Promise<SpendLogEntry> {
  const row = await getSpendLogDetail(requestId);
  if (!row) {
    throw new Error(`Spend log not found: ${requestId}`);
  }

  return proxyRequestLogToSpendLogEntry(
    presentProxyRequestLog(row, { includeDetailFields: true }),
  );
}

export function toProxyRequestLog(
  row: Parameters<typeof presentProxyRequestLog>[0],
  includeDetailFields = false,
): ProxyRequestLog {
  return presentProxyRequestLog(row, { includeDetailFields });
}
