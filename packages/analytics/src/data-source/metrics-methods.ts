import {
  getDailySpendTrend,
  getHourlySpendTrend,
  getMetricsSummary,
} from "../queries/index.js";
import type {
  DailySpendTrend,
  HourlySpendTrend,
  MetricsSummary,
} from "../types/index.js";

export async function getMetricsSummaryImpl(
  days = 30,
): Promise<MetricsSummary> {
  const result = await getMetricsSummary(days);
  return {
    total_spend: result.totalSpend,
    total_tokens: result.totalTokens,
    active_models: result.activeModels,
    error_count: result.errorCount,
  };
}

export async function getDailySpendTrendImpl(
  days = 30,
): Promise<DailySpendTrend[]> {
  const result = await getDailySpendTrend(days);
  return result.map((item) => ({
    date: String(item.date),
    spend: item.spend,
    granularity: item.granularity as "hour" | "day" | undefined,
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
