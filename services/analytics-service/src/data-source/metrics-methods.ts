import {
  getDailySpendTrend,
  getHourlySpendTrend,
  getMetricsSummary,
} from "../queries/index";
import type {
  DailySpendTrend,
  HourlySpendTrend,
  MetricsSummary,
  TimeGranularity,
  TimeRangeParams,
} from "../types/index";

export async function getMetricsSummaryImpl(
  params: TimeRangeParams = {},
): Promise<MetricsSummary> {
  const result = await getMetricsSummary(params);
  return {
    total_spend: result.totalSpend,
    total_tokens: result.totalTokens,
    active_models: result.activeModels,
    error_count: result.errorCount,
    prompt_tokens: result.promptTokens,
    completion_tokens: result.completionTokens,
  };
}

export async function getDailySpendTrendImpl(
  params: TimeRangeParams = {},
): Promise<DailySpendTrend[]> {
  const result = await getDailySpendTrend(params);
  return result.map((item) => ({
    date: String(item.date),
    spend: item.spend,
    granularity: item.granularity as TimeGranularity | undefined,
  }));
}

export async function getHourlySpendTrendImpl(
  days = 1,
): Promise<HourlySpendTrend[]> {
  const result = await getHourlySpendTrend(days);
  return result.map((item) => ({
    timestamp: String(item.timestamp),
    hour: item.hour,
    spend: item.spend,
    total_tokens: item.total_tokens,
    request_count: item.request_count,
  }));
}
