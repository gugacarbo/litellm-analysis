import {
  getApiKeyDetailedStats,
  getCostEfficiencyByModel,
  getDailyTokenTrend,
  getModelRequestDistribution,
  getModelStatistics,
} from "../queries/index.js";
import type {
  ApiKeyStats,
  CostEfficiency,
  DailyTokenTrend,
  ModelRequestDistribution,
  ModelStatistics,
} from "../types/index.js";

export async function getApiKeyStatsImpl(days = 30): Promise<ApiKeyStats[]> {
  const result = await getApiKeyDetailedStats(days);
  return result.map((item) => ({
    key: item.key,
    request_count: Number(item.request_count),
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
    avg_tokens_per_request: Number(item.avg_tokens_per_request),
    success_rate: Number(item.success_rate || 0),
    last_used: item.last_used
      ? new Date(item.last_used as Date).toISOString()
      : "",
  }));
}

export async function getCostEfficiencyImpl(
  days = 30,
): Promise<CostEfficiency[]> {
  const result = await getCostEfficiencyByModel(days);
  return result.map((item) => ({
    model: item.model,
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
    cost_per_1k_tokens: Number(item.cost_per_1k_tokens),
    request_count: Number(item.request_count),
  }));
}

export async function getModelDistributionImpl(
  days = 30,
): Promise<ModelRequestDistribution[]> {
  const result = await getModelRequestDistribution(days);
  return result.map((item) => ({
    model: item.model,
    request_count: Number(item.request_count),
    percentage: Number(item.percentage),
  }));
}

export async function getDailyTokenTrendImpl(
  days = 30,
): Promise<DailyTokenTrend[]> {
  const result = await getDailyTokenTrend(days);
  return result.map((item) => ({
    date: String(item.date),
    prompt_tokens: Number(item.prompt_tokens),
    completion_tokens: Number(item.completion_tokens),
    total_tokens: Number(item.total_tokens),
  }));
}

export async function getModelStatisticsImpl(
  days = 30,
): Promise<ModelStatistics[]> {
  const result = await getModelStatistics(days);
  return result.map((item) => ({
    model: item.model,
    request_count: Number(item.request_count),
    total_spend: Number(item.total_spend),
    total_tokens: Number(item.total_tokens),
    prompt_tokens: Number(item.prompt_tokens),
    completion_tokens: Number(item.completion_tokens),
    avg_tokens_per_request: Number(item.avg_tokens_per_request),
    avg_latency_ms: Number(item.avg_latency_ms || 0),
    success_rate: Number(item.success_rate || 0),
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
    unique_users: Number(item.unique_users || 0),
    unique_api_keys: Number(item.unique_api_keys || 0),
    p50_tokens_per_second: Number(item.p50_tokens_per_second || 0),
  }));
}
