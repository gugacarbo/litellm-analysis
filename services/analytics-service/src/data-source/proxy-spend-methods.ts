import {
  presentProxyRequestLog,
  presentProxyRequestLogListItem,
} from "../presenter/proxy-request-log";
import {
  getApiKeyStats,
  getSpendByKey,
  getSpendByUser,
} from "../queries/proxy/distribution-queries";
import {
  getSpendLogDetail,
  getSpendLogs,
  getSpendLogsCount,
  getSpendTotals,
} from "../queries/proxy/spend-queries";
import type {
  ApiKeyStats,
  ProxyRequestLog,
  SpendByKey,
  SpendByUser,
  SpendLogsFilters,
  SpendLogsResponse,
  SpendTotals,
  TimeRangeParams,
} from "../types/index";

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

  const logs = rows.map((row) => presentProxyRequestLogListItem(row));

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
): Promise<ProxyRequestLog> {
  const row = await getSpendLogDetail(requestId);
  if (!row) {
    throw new Error(`Spend log not found: ${requestId}`);
  }

  return presentProxyRequestLog(row, { includeDetailFields: true });
}

export async function getProxySpendTotalsImpl(
  filters: Pick<SpendLogsFilters, "model" | "startDate" | "endDate">,
): Promise<SpendTotals> {
  return getSpendTotals(filters);
}

export async function getProxySpendByUserImpl(
  params: TimeRangeParams = {},
): Promise<SpendByUser[]> {
  const result = await getSpendByUser(params);
  return result.map((item) => ({
    user: item.user,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens || 0),
    request_count: Number(item.request_count || 0),
  }));
}

export async function getProxySpendByKeyImpl(days = 30): Promise<SpendByKey[]> {
  const result = await getSpendByKey(days);
  return result.map((item) => ({
    key: item.key,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens || 0),
  }));
}

export async function getProxyApiKeyStatsImpl(
  params: TimeRangeParams = {},
): Promise<ApiKeyStats[]> {
  const result = await getApiKeyStats(params);
  return result.map((item) => ({
    key: item.key,
    request_count: Number(item.request_count),
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
    avg_tokens_per_request: Number(item.avg_tokens_per_request),
    success_rate: Number(item.success_rate || 0),
    avg_tokens_per_second: Number(item.avg_tokens_per_second || 0),
    last_used: item.last_used
      ? new Date(item.last_used as Date).toISOString()
      : "",
  }));
}
