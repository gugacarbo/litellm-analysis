import type {
  PaginationMetadata,
  SpendLog,
} from "@lite-llm/contracts/analytics";
import type { AnalyticsQueryParams } from "./analytics";
import { fetchApi, withDateRange, withDays } from "./core";

function buildAnalyticsEndpoint(
  base: string,
  params: AnalyticsQueryParams,
): string {
  let endpoint = base;
  if (params.startDate || params.endDate) {
    endpoint = withDateRange(endpoint, {
      startDate: params.startDate,
      endDate: params.endDate,
    });
  } else if (params.days !== undefined) {
    endpoint = withDays(endpoint, params.days);
  }
  return endpoint;
}

export async function getSpendByModel(
  params: AnalyticsQueryParams = {},
): Promise<{ model: string; total_spend: number }[]> {
  return fetchApi(buildAnalyticsEndpoint("/spend/model", params));
}

export async function getSpendLogs(
  params: {
    model?: string;
    user?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  },
  options?: RequestInit,
): Promise<{ logs: SpendLog[]; pagination: PaginationMetadata }> {
  const searchParams = new URLSearchParams();
  if (params.model) searchParams.set("model", params.model);
  if (params.user) searchParams.set("user", params.user);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));

  return fetchApi(`/spend/logs?${searchParams}`, options);
}

export async function getSpendByUser(
  params: AnalyticsQueryParams = {},
): Promise<
  {
    user: string;
    total_spend: number;
    total_tokens: number;
    request_count: number;
  }[]
> {
  return fetchApi(buildAnalyticsEndpoint("/spend/user", params));
}

export async function getDailySpendTrend(
  params: AnalyticsQueryParams = {},
): Promise<{ date: string; spend: number }[]> {
  if (params.startDate || params.endDate) {
    return fetchApi(buildAnalyticsEndpoint("/spend/trend", params));
  }
  const days = params.days ?? 30;
  return fetchApi(`/spend/trend?days=${days}`);
}
