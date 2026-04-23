import type { PaginationMetadata, SpendLog } from '../../types/analytics';
import { fetchApi } from './core';

function withDays(endpoint: string, days?: number): string {
  if (days === undefined) {
    return endpoint;
  }
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}days=${days}`;
}

export async function getSpendByModel(
  days?: number,
): Promise<{ model: string; total_spend: number }[]> {
  return fetchApi(withDays('/spend/model', days));
}

export async function getSpendLogs(params: {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: SpendLog[]; pagination: PaginationMetadata }> {
  const searchParams = new URLSearchParams();
  if (params.model) searchParams.set('model', params.model);
  if (params.user) searchParams.set('user', params.user);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  return fetchApi(`/spend/logs?${searchParams}`);
}

export async function getSpendLogsCount(params: {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
}): Promise<number> {
  const searchParams = new URLSearchParams();
  if (params.model) searchParams.set('model', params.model);
  if (params.user) searchParams.set('user', params.user);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);

  const response = await fetchApi<{ count: number }>(
    `/spend/logs/count?${searchParams}`,
  );
  return response.count;
}

export async function getSpendByUser(days?: number): Promise<
  {
    user: string;
    total_spend: number;
    total_tokens: number;
    request_count: number;
  }[]
> {
  return fetchApi(withDays('/spend/user', days));
}

export async function getSpendByKey(
  days?: number,
): Promise<{ key: string; total_spend: number; total_tokens: number }[]> {
  return fetchApi(withDays('/spend/key', days));
}

export async function getDailySpendTrend(
  days = 30,
): Promise<{ date: string; spend: number }[]> {
  return fetchApi(`/spend/trend?days=${days}`);
}
