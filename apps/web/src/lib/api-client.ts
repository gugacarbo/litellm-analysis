import type { SpendLog, PaginationMetadata } from '../types/analytics';

const API_BASE = '/api';

export type ApiError = {
  error: string;
};

export type ApiResponse<T> = T | ApiError;

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  // Handle 501 Not Implemented - feature unavailable in current mode
  if (response.status === 501) {
    const errorData = await response.json() as ApiError;
    throw new FeatureUnavailableError(errorData.error);
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export class FeatureUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureUnavailableError';
  }
}

export function isFeatureUnavailable(error: unknown): boolean {
  return error instanceof FeatureUnavailableError ||
    (error instanceof Error && error.message.includes('not available in'));
}

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

  const response = await fetchApi<{ count: number }>(`/spend/logs/count?${searchParams}`);
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

export async function getModelDetails(): Promise<
  {
    model_name: string;
    input_cost_per_token: string;
    output_cost_per_token: string;
  }[]
> {
  return fetchApi('/model/details');
}

export async function getErrorLogs(limit = 50): Promise<
  {
    id: string;
    error_type: string;
    model: string;
    user: string;
    error_message: string;
    timestamp: string;
    status_code: number;
  }[]
> {
  return fetchApi(`/errors?limit=${limit}`);
}

export async function getMetricsSummary(): Promise<{
  totalSpend: number;
  totalTokens: number;
  activeModels: number;
  errorCount: number;
}> {
  return fetchApi('/metrics');
}

export async function getDailySpendTrend(
  days = 30,
): Promise<{ date: string; spend: number }[]> {
  return fetchApi(`/spend/trend?days=${days}`);
}

export async function getTokenDistribution(): Promise<
  {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    avg_tokens_per_request: number;
    input_output_ratio: number;
  }[]
> {
  return fetchApi('/analytics/tokens');
}

export async function getPerformanceMetrics(): Promise<{
  total_requests: number;
  avg_duration_ms: number;
  success_rate: number;
}> {
  return fetchApi('/analytics/performance');
}

export async function getHourlyUsagePatterns(): Promise<
  { hour: number; request_count: number; total_spend: number; total_tokens: number }[]
> {
  return fetchApi('/analytics/temporal');
}

export async function getApiKeyDetailedStats(): Promise<
  {
    key: string;
    request_count: number;
    total_spend: number;
    total_tokens: number;
    avg_tokens_per_request: number;
    success_rate: number;
    last_used: string;
  }[]
> {
  return fetchApi('/analytics/keys');
}

export async function getCostEfficiencyByModel(): Promise<
  {
    model: string;
    total_spend: number;
    total_tokens: number;
    cost_per_1k_tokens: number;
    request_count: number;
  }[]
> {
  return fetchApi('/analytics/cost-efficiency');
}

export async function getModelRequestDistribution(): Promise<
  { model: string; request_count: number; percentage: number }[]
> {
  return fetchApi('/analytics/model-distribution');
}

export async function getDailyTokenTrend(
  days = 30,
): Promise<{ date: string; prompt_tokens: number; completion_tokens: number; total_tokens: number }[]> {
  return fetchApi(`/analytics/token-trend?days=${days}`);
}

export async function getModelStatistics(): Promise<
  {
    model: string;
    request_count: number;
    total_spend: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    avg_tokens_per_request: number;
    avg_latency_ms: number;
    success_rate: number;
    error_count: number;
    avg_input_cost: number;
    avg_output_cost: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    first_seen: string;
    last_seen: string;
    unique_users: number;
    unique_api_keys: number;
  }[]
> {
  return fetchApi('/analytics/model-stats');
}

export type ModelConfig = {
  modelName: string;
  litellmParams: Record<string, unknown>;
};

export async function getAllModels(): Promise<ModelConfig[]> {
  return fetchApi('/models');
}

export async function createModel(model: ModelConfig): Promise<{ success: boolean }> {
  return fetchApi('/models', {
    method: 'POST',
    body: JSON.stringify(model),
  });
}

export async function updateModel(
  modelName: string,
  litellmParams: Record<string, unknown>,
  newName?: string
): Promise<{ success: boolean }> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: 'PUT',
    body: JSON.stringify({ litellmParams, ...(newName ? { modelName: newName } : {}) }),
  });
}

export async function deleteModel(
  modelName: string
): Promise<{ success: boolean }> {
  return fetchApi(`/models/${encodeURIComponent(modelName)}`, {
    method: 'DELETE',
  });
}

export async function deleteModelLogs(
  modelName: string
): Promise<{ success: boolean }> {
  return fetchApi(`/models/logs/${encodeURIComponent(modelName)}`, {
    method: 'DELETE',
  });
}



export async function mergeModels(
  sourceModel: string,
  targetModel: string
): Promise<{ success: boolean }> {
  return fetchApi('/models/merge', {
    method: 'POST',
    body: JSON.stringify({ sourceModel, targetModel }),
  });
}
