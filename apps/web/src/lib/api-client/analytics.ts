import { fetchApi } from "./core";
export type ModelStatistics = {
  model: string;
  request_count: number;
  total_spend: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  avg_tokens_per_request: number;
  avg_latency_ms: number | null;
  success_rate: number | null;
  error_count: number;
  avg_input_cost: number | null;
  avg_output_cost: number | null;
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  p99_latency_ms: number | null;
  first_seen: string | null;
  last_seen: string | null;
  unique_users: number;
  unique_api_keys: number;
  p50_tokens_per_second: number;
  avg_tokens_per_second: number;
  max_tokens_per_second: number;
};

function withDays(endpoint: string, days?: number): string {
  if (days === undefined) {
    return endpoint;
  }
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}days=${days}`;
}

export async function getModelDetails(): Promise<
  {
    model_name: string;
    input_cost_per_token: string;
    output_cost_per_token: string;
  }[]
> {
  return fetchApi("/model/details");
}

export async function getErrorLogs(
  limit = 50,
  days?: number,
  options?: RequestInit,
): Promise<
  {
    id: string;
    error_type: string;
    model: string;
    user: string;
    error_message: string;
    api_key: string | null;
    spend_status: string | null;
    timestamp: string;
    status_code: number;
    litellm_model_name: string | null;
    request_kwargs: Record<string, unknown> | null;
  }[]
> {
  return fetchApi(withDays(`/errors?limit=${limit}`, days), options);
}

export async function getMetricsSummary(days?: number): Promise<{
  totalSpend: number;
  totalTokens: number;
  activeModels: number;
  errorCount: number;
}> {
  return fetchApi(withDays("/metrics", days));
}

export async function getTokenDistribution(days?: number): Promise<
  {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    avg_tokens_per_request: number;
    input_output_ratio: number;
  }[]
> {
  return fetchApi(withDays("/analytics/tokens", days));
}

export async function getPerformanceMetrics(days?: number): Promise<{
  total_requests: number;
  avg_duration_ms: number;
  success_rate: number;
}> {
  return fetchApi(withDays("/analytics/performance", days));
}

export async function getHourlyUsagePatterns(days?: number): Promise<
  {
    hour: number;
    request_count: number;
    total_spend: number;
    total_tokens: number;
  }[]
> {
  return fetchApi(withDays("/analytics/temporal", days));
}

export async function getApiKeyDetailedStats(days?: number): Promise<
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
  return fetchApi(withDays("/analytics/keys", days));
}

export async function getCostEfficiencyByModel(days?: number): Promise<
  {
    model: string;
    total_spend: number;
    total_tokens: number;
    cost_per_1k_tokens: number;
    request_count: number;
  }[]
> {
  return fetchApi(withDays("/analytics/cost-efficiency", days));
}

export async function getModelRequestDistribution(
  days?: number,
): Promise<{ model: string; request_count: number; percentage: number }[]> {
  return fetchApi(withDays("/analytics/model-distribution", days));
}

export async function getDailyTokenTrend(days = 30): Promise<
  {
    date: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }[]
> {
  return fetchApi(`/analytics/token-trend?days=${days}`);
}

export async function getModelStatistics(days?: number): Promise<
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
    p50_tokens_per_second: number;
    avg_tokens_per_second: number;
    max_tokens_per_second: number;
  }[]
> {
  return fetchApi(withDays("/analytics/model-stats", days));
}

export async function getModelDailySpend(
  model: string,
  days?: number,
): Promise<
  {
    date: string;
    spend: number;
    total_tokens: number;
    request_count: number;
  }[]
> {
  return fetchApi(
    withDays(
      `/analytics/model-daily-spend?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelDailyTokens(
  model: string,
  days?: number,
): Promise<
  {
    date: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }[]
> {
  return fetchApi(
    withDays(
      `/analytics/model-daily-tokens?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelHourlyUsage(
  model: string,
  days?: number,
): Promise<
  {
    hour: number;
    request_count: number;
    total_spend: number;
    total_tokens: number;
  }[]
> {
  return fetchApi(
    withDays(
      `/analytics/model-hourly-usage?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelLatencyTrend(
  model: string,
  days?: number,
): Promise<
  {
    date: string;
    avg_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
  }[]
> {
  return fetchApi(
    withDays(
      `/analytics/model-latency-trend?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelErrorBreakdown(
  model: string,
  days?: number,
): Promise<
  {
    error_type: string;
    count: number;
    last_occurred: string;
  }[]
> {
  return fetchApi(
    withDays(
      `/analytics/model-error-breakdown?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelDailyErrors(
  model: string,
  days?: number,
): Promise<{ date: string; error_count: number }[]> {
  return fetchApi(
    withDays(
      `/analytics/model-daily-errors?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelTopUsers(
  model: string,
  days?: number,
): Promise<
  {
    user: string | null;
    total_spend: number;
    total_tokens: number;
    request_count: number;
  }[]
> {
  return fetchApi(
    withDays(
      `/analytics/model-top-users?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelTopApiKeys(
  model: string,
  days?: number,
): Promise<
  {
    api_key: string | null;
    total_spend: number;
    total_tokens: number;
    request_count: number;
    success_rate: number;
  }[]
> {
  return fetchApi(
    withDays(
      `/analytics/model-top-api-keys?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelCacheHitRate(
  model: string,
  days?: number,
): Promise<{
  cache_hits: number;
  total_requests: number;
  cache_hit_rate: number;
}> {
  return fetchApi(
    withDays(
      `/analytics/model-cache-hit-rate?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelTTFT(
  model: string,
  days?: number,
): Promise<{
  avg_ttft_ms: number;
  p50_ttft_ms: number;
  p95_ttft_ms: number;
  p99_ttft_ms: number;
  min_ttft_ms: number;
  max_ttft_ms: number;
}> {
  return fetchApi(
    withDays(`/analytics/model-ttft?model=${encodeURIComponent(model)}`, days),
  );
}

export async function getModelStatusDistribution(
  model: string,
  days?: number,
): Promise<{ status: string; count: number; percentage: number }[]> {
  return fetchApi(
    withDays(
      `/analytics/model-status-distribution?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}

export async function getModelProviderBreakdown(
  model: string,
  days?: number,
): Promise<
  {
    provider: string;
    request_count: number;
    total_spend: number;
    avg_latency_ms: number;
  }[]
> {
  return fetchApi(
    withDays(
      `/analytics/model-provider-breakdown?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
