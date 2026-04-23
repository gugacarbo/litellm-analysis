import type { PaginationMetadata, SpendLog } from '../../types/analytics';
import { fetchApi } from './core';

export async function getSpendByModel(): Promise<
  { model: string; total_spend: number }[]
> {
  return fetchApi('/spend/model');
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

export async function getSpendByUser(): Promise<
  { user: string; total_spend: number; total_tokens: number }[]
> {
  return fetchApi('/spend/user');
}

export async function getSpendByKey(): Promise<
  { key: string; total_spend: number; total_tokens: number }[]
> {
  return fetchApi('/spend/key');
}

export async function getDailySpendTrend(
  days = 30,
): Promise<{ date: string; spend: number }[]> {
  return fetchApi(`/spend/trend?days=${days}`);
}
