import { fetchApi, withDays } from "./core";

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
