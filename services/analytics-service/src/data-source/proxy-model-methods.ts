import {
  deleteModelLogs,
  getDailyErrorTrendByModel,
  getDailyLatencyTrendByModel,
  getDailySpendTrendByModel,
  getDailyTokenTrendByModel,
  getErrorBreakdownByModel,
  getHourlyUsageByModel,
  getModelCacheHitRateByModel,
  getModelProviderBreakdownByModel,
  getModelStatistics,
  getModelStatusDistributionByModel,
  getModelTTFTPercentilesByModel,
  mergeModels,
} from "../queries/proxy/model-queries";
import type {
  ModelCacheHitRate,
  ModelDailyErrorTrend,
  ModelDailyLatencyTrend,
  ModelDailySpendTrend,
  ModelDailyTokenTrend,
  ModelErrorBreakdown,
  ModelHourlyUsage,
  ModelProviderBreakdown,
  ModelStatistics,
  ModelStatusDistribution,
  ModelTTFTPercentiles,
  TimeGranularity,
  TimeRangeParams,
} from "../types/index";

export async function getProxyModelStatisticsImpl(
  params: TimeRangeParams = {},
): Promise<ModelStatistics[]> {
  const result = (await getModelStatistics(params)) as Array<
    Record<string, unknown>
  >;
  return result.map((item) => ({
    model: String(item.model ?? ""),
    request_count: Number(item.request_count),
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
    prompt_tokens: Number(item.prompt_tokens),
    completion_tokens: Number(item.completion_tokens),
    avg_tokens_per_request: Number(item.avg_tokens_per_request),
    avg_latency_ms: Number(item.avg_latency_ms || 0),
    success_rate: Number(item.success_rate || 0),
    avg_tokens_per_second: Number(item.avg_tokens_per_second || 0),
    error_count: Number(item.error_count || 0),
    avg_input_cost: Number(item.avg_input_cost || 0),
    avg_output_cost: Number(item.avg_output_cost || 0),
    p50_latency_ms: Number(item.p50_latency_ms || 0),
    p95_latency_ms: Number(item.p95_latency_ms || 0),
    p99_latency_ms: Number(item.p99_latency_ms || 0),
    first_seen: item.first_seen
      ? new Date(item.first_seen as Date).toISOString()
      : "",
    last_seen: item.last_seen
      ? new Date(item.last_seen as Date).toISOString()
      : "",
    unique_users: 0,
    unique_api_keys: 0,
    p50_tokens_per_second: Number(item.p50_tokens_per_second || 0),
    max_tokens_per_second: Number(item.max_tokens_per_second || 0),
  }));
}

export async function mergeModelsImpl(
  sourceModel: string,
  targetModel: string,
): Promise<void> {
  await mergeModels(sourceModel, targetModel);
}

export async function deleteModelLogsImpl(modelName: string): Promise<void> {
  await deleteModelLogs(modelName);
}

export async function getDailySpendTrendByModelImpl(
  model: string,
  days?: number,
): Promise<ModelDailySpendTrend[]> {
  const result = await getDailySpendTrendByModel(model, days);
  return result.map((item) => ({
    date: String(item.date),
    spend: Number(item.spend),
    total_tokens: Number(item.total_tokens),
    request_count: Number(item.request_count),
    granularity: item.granularity as TimeGranularity | undefined,
  }));
}

export async function getDailyTokenTrendByModelImpl(
  model: string,
  days?: number,
): Promise<ModelDailyTokenTrend[]> {
  const result = await getDailyTokenTrendByModel(model, days);
  return result.map((item) => ({
    date: String(item.date),
    prompt_tokens: Number(item.prompt_tokens),
    completion_tokens: Number(item.completion_tokens),
    total_tokens: Number(item.total_tokens),
    granularity: item.granularity as TimeGranularity | undefined,
  }));
}

export async function getHourlyUsageByModelImpl(
  model: string,
  days?: number,
): Promise<ModelHourlyUsage[]> {
  const result = await getHourlyUsageByModel(model, days);
  return result.map((item) => ({
    hour: Number(item.hour),
    request_count: Number(item.request_count),
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
  }));
}

export async function getDailyLatencyTrendByModelImpl(
  model: string,
  days?: number,
): Promise<ModelDailyLatencyTrend[]> {
  const result = await getDailyLatencyTrendByModel(model, days);
  return result.map((item) => ({
    date: String(item.date),
    avg_latency_ms: Number(item.avg_latency_ms),
    p50_latency_ms: Number(item.p50_latency_ms),
    p95_latency_ms: Number(item.p95_latency_ms),
    p99_latency_ms: Number(item.p99_latency_ms),
    granularity: item.granularity as TimeGranularity | undefined,
  }));
}

export async function getErrorBreakdownByModelImpl(
  model: string,
  days?: number,
): Promise<ModelErrorBreakdown[]> {
  const result = await getErrorBreakdownByModel(model, days);
  return result.map((item) => ({
    error_type: String(item.error_type),
    count: Number(item.count),
    last_occurred: String(item.last_occurred),
  }));
}

export async function getDailyErrorTrendByModelImpl(
  model: string,
  days?: number,
): Promise<ModelDailyErrorTrend[]> {
  const result = await getDailyErrorTrendByModel(model, days);
  return result.map((item) => ({
    date: String(item.date),
    error_count: Number(item.error_count),
    granularity: item.granularity as TimeGranularity | undefined,
  }));
}

export async function getCacheHitRateByModelImpl(
  model: string,
  days?: number,
): Promise<ModelCacheHitRate> {
  const result = await getModelCacheHitRateByModel(model, days);
  return {
    cache_hits: Number(result.cache_hits),
    total_requests: Number(result.total_requests),
    cache_hit_rate: Number(result.cache_hit_rate),
  };
}

export async function getTTFTPercentilesByModelImpl(
  model: string,
  days?: number,
): Promise<ModelTTFTPercentiles> {
  const result = await getModelTTFTPercentilesByModel(model, days);
  return {
    avg_ttft_ms: Number(result.avg_ttft_ms),
    p50_ttft_ms: Number(result.p50_ttft_ms),
    p95_ttft_ms: Number(result.p95_ttft_ms),
    p99_ttft_ms: Number(result.p99_ttft_ms),
    min_ttft_ms: Number(result.min_ttft_ms),
    max_ttft_ms: Number(result.max_ttft_ms),
  };
}

export async function getStatusDistributionByModelImpl(
  model: string,
  days?: number,
): Promise<ModelStatusDistribution[]> {
  const result = await getModelStatusDistributionByModel(model, days);
  return result.map((item) => ({
    status: String(item.status),
    count: Number(item.count),
    percentage: Number(item.percentage),
  }));
}

export async function getProviderBreakdownByModelImpl(
  model: string,
  days?: number,
): Promise<ModelProviderBreakdown[]> {
  const result = await getModelProviderBreakdownByModel(model, days);
  return result.map((item) => ({
    provider: String(item.provider),
    request_count: Number(item.request_count),
    total_spend: Number(item.total_spend),
    avg_latency_ms: Number(item.avg_latency_ms),
  }));
}
