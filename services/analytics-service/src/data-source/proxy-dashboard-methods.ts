import {
  getCostEfficiency,
  getMetricsSummary,
  getPerformanceMetrics,
} from "../queries/proxy/analytics-queries";
import {
  getModelDistribution,
  getSpendByModel,
  getTokenDistribution,
} from "../queries/proxy/distribution-queries";
import {
  getDailySpendTrend,
  getDailyTokenTrend,
  getHourlySpendTrend,
  getHourlyUsagePatterns,
} from "../queries/proxy/trend-queries";
import type {
  CostEfficiency,
  DailySpendTrend,
  DailyTokenTrend,
  HourlySpendTrend,
  HourlyUsagePattern,
  MetricsSummary,
  ModelRequestDistribution,
  PerformanceMetrics,
  SpendByModel,
  TimeGranularity,
  TimeRangeParams,
  TokenDistribution,
} from "../types/index";

export async function getProxyMetricsSummaryImpl(
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

export async function getProxyPerformanceMetricsImpl(
  params: TimeRangeParams = {},
): Promise<PerformanceMetrics> {
  const result = await getPerformanceMetrics(params);
  return {
    total_requests: Number(result.total_requests),
    avg_duration_ms: Number(result.avg_duration_ms || 0),
    avg_tokens_per_second: Number(result.avg_tokens_per_second || 0),
    success_rate: Number(result.success_rate || 0),
  };
}

export async function getProxyCostEfficiencyImpl(
  params: TimeRangeParams = {},
): Promise<CostEfficiency[]> {
  const result = await getCostEfficiency(params);
  return result.map((item) => ({
    model: item.model,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
    cost_per_1k_tokens: Number(item.cost_per_1k_tokens),
    request_count: Number(item.request_count),
  }));
}

export async function getProxyDailySpendTrendImpl(
  params: TimeRangeParams = {},
): Promise<DailySpendTrend[]> {
  const result = await getDailySpendTrend(params);
  return result.map((item) => ({
    date: String(item.date),
    spend: item.spend,
    granularity: item.granularity as TimeGranularity | undefined,
  }));
}

export async function getProxyHourlySpendTrendImpl(
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

export async function getProxyDailyTokenTrendImpl(
  params: TimeRangeParams = {},
): Promise<DailyTokenTrend[]> {
  const result = await getDailyTokenTrend(params);
  return result.map((item) => ({
    date: String(item.date),
    prompt_tokens: Number(item.prompt_tokens),
    completion_tokens: Number(item.completion_tokens),
    total_tokens: Number(item.total_tokens),
    request_count: Number(item.request_count),
    granularity: item.granularity as TimeGranularity | undefined,
  }));
}

export async function getProxyHourlyUsagePatternsImpl(
  params: TimeRangeParams = {},
): Promise<HourlyUsagePattern[]> {
  const result = await getHourlyUsagePatterns(params);
  return result.map((item) => ({
    hour: Number(item.hour),
    request_count: Number(item.request_count),
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
  }));
}

export async function getProxySpendByModelImpl(
  params: TimeRangeParams = {},
): Promise<SpendByModel[]> {
  const result = await getSpendByModel(params);
  return result.map((item) => ({
    model: item.model,
    total_spend: Number(item.total_spend),
  }));
}

export async function getProxyTokenDistributionImpl(
  params: TimeRangeParams = {},
): Promise<TokenDistribution[]> {
  const result = await getTokenDistribution(params);
  return result.map((item) => ({
    model: item.model,
    prompt_tokens: Number(item.prompt_tokens),
    completion_tokens: Number(item.completion_tokens),
    avg_tokens_per_request: Number(item.avg_tokens_per_request),
    input_output_ratio: Number(item.input_output_ratio),
  }));
}

export async function getProxyModelDistributionImpl(
  params: TimeRangeParams = {},
): Promise<ModelRequestDistribution[]> {
  const result = await getModelDistribution(params);
  return result.map((item) => ({
    model: item.model,
    request_count: Number(item.request_count),
    percentage: Number(item.percentage),
  }));
}
