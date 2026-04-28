import {
  getSpendByModel,
  getSpendByUser,
  getSpendByKey,
  getSpendLogs,
  getSpendLogsCount,
} from '../queries/index.js';
import { toNullableNumber } from './utils.js';
import type {
  SpendByKey,
  SpendByModel,
  SpendByUser,
  SpendLogsFilters,
  SpendLogsResponse,
} from '../types/index.js';

export async function getSpendByModelImpl(
  days = 30,
): Promise<SpendByModel[]> {
  const result = await getSpendByModel(days);
  return result.map((item) => ({
    model: item.model,
    total_spend: Number(item.total_spend),
  }));
}

export async function getSpendByUserImpl(
  days = 30,
): Promise<SpendByUser[]> {
  const result = await getSpendByUser(days);
  return result.map((item) => ({
    user: item.user,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens || 0),
    request_count: Number(item.request_count || 0),
  }));
}

export async function getSpendByKeyImpl(
  days = 30,
): Promise<SpendByKey[]> {
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
  getSpendLogsCountFn: (
    filters: SpendLogsFilters,
  ) => Promise<number>,
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

  const logs = result.map((item) => ({
    request_id: item.request_id,
    model: item.model,
    user: item.user,
    total_tokens: item.total_tokens,
    prompt_tokens: item.prompt_tokens,
    completion_tokens: item.completion_tokens,
    spend: Number(item.spend),
    time_to_first_token_ms: toNullableNumber(
      item.time_to_first_token_ms,
    ),
    start_time: item.startTime
      ? new Date(item.startTime).toISOString()
      : '',
    end_time: item.endTime
      ? new Date(item.endTime).toISOString()
      : null,
    api_key: item.api_key,
    status: item.status,
  }));

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
