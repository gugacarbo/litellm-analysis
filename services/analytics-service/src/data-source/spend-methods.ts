import { presentLitellmSpendLogAsProxy } from "../presenter/litellm-spend-log";
import {
  getSpendByKey,
  getSpendByModel,
  getSpendByUser,
  getSpendLogById,
  getSpendLogs,
  getSpendLogsCount,
  getSpendTotals,
} from "../queries/index";
import type {
  ProxyRequestLog,
  SpendByKey,
  SpendByModel,
  SpendByUser,
  SpendLogsFilters,
  SpendLogsResponse,
  SpendTotals,
  TimeRangeParams,
} from "../types/index";

export async function getSpendByModelImpl(
  params: TimeRangeParams = {},
): Promise<SpendByModel[]> {
  const result = await getSpendByModel(params);
  return result.map((item) => ({
    model: item.model,
    total_spend: Number(item.total_spend),
  }));
}

export async function getSpendByUserImpl(
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

export async function getSpendByKeyImpl(days = 30): Promise<SpendByKey[]> {
  const result = await getSpendByKey(days);
  return result.map((item) => ({
    key: item.key,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens || 0),
  }));
}

export async function getSpendLogsCountImpl(
  filters: SpendLogsFilters,
): Promise<number> {
  return getSpendLogsCount({
    model: filters.model,
    user: filters.user,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
}

export async function getSpendLogsImpl(
  filters: SpendLogsFilters,
  getSpendLogsCountFn: (filters: SpendLogsFilters) => Promise<number>,
): Promise<SpendLogsResponse> {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [result, total] = await Promise.all([
    getSpendLogs({
      model: filters.model,
      user: filters.user,
      startDate: filters.startDate,
      endDate: filters.endDate,
      limit,
      offset,
    }),
    getSpendLogsCountFn(filters),
  ]);

  const logs = (result as Array<Record<string, unknown>>).map((item) =>
    presentLitellmSpendLogAsProxy({
      ...item,
      start_time: item.startTime
        ? new Date(item.startTime as string | number | Date).toISOString()
        : item.start_time,
      end_time: item.endTime
        ? new Date(item.endTime as string | number | Date).toISOString()
        : item.end_time,
    }),
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

export async function getSpendLogDetailImpl(
  requestId: string,
): Promise<ProxyRequestLog> {
  const rawItem = (await getSpendLogById(requestId)) as
    | Record<string, unknown>
    | undefined;
  if (!rawItem) {
    throw new Error(`Spend log not found: ${requestId}`);
  }

  return presentLitellmSpendLogAsProxy({
    ...rawItem,
    start_time: rawItem.start_time
      ? new Date(rawItem.start_time as string | number | Date).toISOString()
      : rawItem.start_time,
    end_time: rawItem.end_time
      ? new Date(rawItem.end_time as string | number | Date).toISOString()
      : rawItem.end_time,
  });
}

export async function getSpendTotalsImpl(
  filters: Pick<SpendLogsFilters, "model" | "startDate" | "endDate">,
): Promise<SpendTotals> {
  return getSpendTotals(filters);
}
