import {
  getMetricsSummary,
  getDailySpendTrend,
} from '../queries/index.js';
import type {
  DailySpendTrend,
  MetricsSummary,
} from '../types/index.js';

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
  }));
}
