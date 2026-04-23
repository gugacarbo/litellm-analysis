import { fetchApi } from './core';

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
  {
    hour: number;
    request_count: number;
    total_spend: number;
    total_tokens: number;
  }[]
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
): Promise<
  {
    date: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }[]
> {
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
