import {
  getHourlyUsagePatterns,
  getPerformanceMetrics,
  getTokenDistribution,
} from "../queries/index";
import type {
  HourlyUsagePattern,
  PerformanceMetrics,
  TimeRangeParams,
  TokenDistribution,
} from "../types/index";

export async function getTokenDistributionImpl(
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

export async function getPerformanceMetricsImpl(
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

export async function getHourlyUsagePatternsImpl(
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
