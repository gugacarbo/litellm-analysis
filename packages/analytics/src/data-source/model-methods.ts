import {
  createModel,
  deleteModel,
  deleteModelLogs,
  getAllModels,
  getDailyErrorTrendByModel,
  getDailyLatencyTrendByModel,
  getDailySpendTrendByModel,
  getDailyTokenTrendByModel,
  getErrorBreakdownByModel,
  getHourlyUsageByModel,
  getModelCacheHitRateByModel,
  getModelDetails,
  getModelProviderBreakdownByModel,
  getModelStatusDistributionByModel,
  getModelTTFTPercentilesByModel,
  getTopApiKeysByModel,
  getTopUsersByModel,
  mergeModels,
  updateModel,
} from "../queries/index";
import type {
  ModelCacheHitRate,
  ModelDailyErrorTrend,
  ModelDailyLatencyTrend,
  ModelDailySpendTrend,
  ModelDailyTokenTrend,
  ModelDetail,
  ModelEntry,
  ModelErrorBreakdown,
  ModelHourlyUsage,
  ModelProviderBreakdown,
  ModelStatusDistribution,
  ModelTTFTPercentiles,
} from "../types/index";

export async function getModelsImpl(): Promise<ModelEntry[]> {
  const result = await getAllModels();
  return result.map((item) => ({
    modelName: item.modelName,
    litellmParams: item.litellmParams as Record<string, unknown> | null,
  }));
}

export async function getModelDetailsImpl(): Promise<ModelDetail[]> {
  const result = await getModelDetails();
  return result.map((item) => ({
    model_name: item.model_name,
    input_cost_per_token: item.input_cost_per_token as string | null,
    output_cost_per_token: item.output_cost_per_token as string | null,
  }));
}

export async function createModelImpl(model: {
  modelName: string;
  litellmParams: Record<string, unknown>;
}): Promise<void> {
  await createModel(model);
}

export async function updateModelImpl(
  modelName: string,
  updates: {
    litellmParams?: Record<string, unknown>;
    modelName?: string;
  },
): Promise<void> {
  await updateModel(modelName, updates);
}

export async function deleteModelImpl(modelName: string): Promise<void> {
  await deleteModel(modelName);
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
  }));
}

export async function getTopUsersByModelImpl(model: string, days?: number) {
  const result = await getTopUsersByModel(model, days);
  return result.map((item) => ({
    user: item.user,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
    request_count: Number(item.request_count),
  }));
}

export async function getTopApiKeysByModelImpl(model: string, days?: number) {
  const result = await getTopApiKeysByModel(model, days);
  return result.map((item) => ({
    api_key: item.api_key,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
    request_count: Number(item.request_count),
    success_rate: Number(item.success_rate),
    avg_tokens_per_second: Number(item.avg_tokens_per_second || 0),
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
