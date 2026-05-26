import {
  type DateRangeParams,
  fetchApi,
  withDateRange,
  withDays,
} from "./core";

export type AnalyticsQueryParams = {
  days?: number;
  startDate?: string;
  endDate?: string;
};

function buildAnalyticsEndpoint(
  base: string,
  params: AnalyticsQueryParams,
): string {
  let endpoint = base;
  if (params.startDate || params.endDate) {
    const dateRange: DateRangeParams = {
      startDate: params.startDate,
      endDate: params.endDate,
    };
    endpoint = withDateRange(endpoint, dateRange);
  } else if (params.days !== undefined) {
    endpoint = withDays(endpoint, params.days);
  }
  return endpoint;
}

export async function getMetricsSummary(
  params: AnalyticsQueryParams = {},
): Promise<{
  totalSpend: number;
  totalTokens: number;
  activeModels: number;
  errorCount: number;
  promptTokens: number;
  completionTokens: number;
}> {
  return fetchApi(buildAnalyticsEndpoint("/metrics", params));
}

export async function getTokenDistribution(
  params: AnalyticsQueryParams = {},
): Promise<
  {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    avg_tokens_per_request: number;
    input_output_ratio: number;
  }[]
> {
  return fetchApi(buildAnalyticsEndpoint("/analytics/tokens", params));
}

export async function getPerformanceMetrics(
  params: AnalyticsQueryParams = {},
): Promise<{
  total_requests: number;
  avg_duration_ms: number;
  success_rate: number;
  avg_tokens_per_second: number;
}> {
  return fetchApi(buildAnalyticsEndpoint("/analytics/performance", params));
}

export async function getHourlyUsagePatterns(
  params: AnalyticsQueryParams = {},
): Promise<
  {
    hour: number;
    request_count: number;
    total_spend: number;
    total_tokens: number;
  }[]
> {
  return fetchApi(buildAnalyticsEndpoint("/analytics/temporal", params));
}

export async function getApiKeyDetailedStats(
  params: AnalyticsQueryParams = {},
): Promise<
  {
    key: string;
    request_count: number;
    total_spend: number;
    total_tokens: number;
    avg_tokens_per_request: number;
    success_rate: number;
    avg_tokens_per_second: number;
    last_used: string;
  }[]
> {
  return fetchApi(buildAnalyticsEndpoint("/analytics/keys", params));
}

export async function getCostEfficiencyByModel(
  params: AnalyticsQueryParams = {},
): Promise<
  {
    model: string;
    total_spend: number;
    total_tokens: number;
    cost_per_1k_tokens: number;
    request_count: number;
  }[]
> {
  return fetchApi(buildAnalyticsEndpoint("/analytics/cost-efficiency", params));
}

export async function getModelRequestDistribution(
  params: AnalyticsQueryParams = {},
): Promise<{ model: string; request_count: number; percentage: number }[]> {
  return fetchApi(
    buildAnalyticsEndpoint("/analytics/model-distribution", params),
  );
}

export async function getDailyTokenTrend(
  params: AnalyticsQueryParams = {},
): Promise<
  {
    date: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    request_count: number;
  }[]
> {
  if (params.startDate || params.endDate) {
    return fetchApi(buildAnalyticsEndpoint("/analytics/token-trend", params));
  }
  const days = params.days ?? 30;
  return fetchApi(`/analytics/token-trend?days=${days}`);
}

export async function getModelStatistics(
  params: AnalyticsQueryParams = {},
): Promise<
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
    enabled?: boolean;
  }[]
> {
  return fetchApi(buildAnalyticsEndpoint("/analytics/model-stats", params));
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
