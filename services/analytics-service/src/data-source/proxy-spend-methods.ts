import {
  presentProxyRequestLog,
  presentProxyRequestLogListItem,
} from "../presenter/proxy-request-log";
import {
  getSpendLogDetail,
  getSpendLogs,
  getSpendLogsCount,
  getSpendTotals,
} from "../queries/proxy/spend-queries";
import type {
  ProxyRequestLog,
  SpendLogsFilters,
  SpendLogsResponse,
  SpendTotals,
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
