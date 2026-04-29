import type { AnalyticsDataSource } from "@lite-llm/analytics";
import { vi } from "vitest";

export type DataSourceOverrides = Partial<AnalyticsDataSource>;

export function createMockDataSource(
  overrides: DataSourceOverrides = {},
): AnalyticsDataSource {
  const base: AnalyticsDataSource = {
    getMetricsSummary: vi.fn().mockResolvedValue({
      total_spend: 0,
      total_tokens: 0,
      active_models: 0,
      error_count: 0,
    }),
    getDailySpendTrend: vi.fn().mockResolvedValue([]),
    getSpendByModel: vi.fn().mockResolvedValue([]),
    getSpendByUser: vi.fn().mockResolvedValue([]),
    getSpendByKey: vi.fn().mockResolvedValue([]),
    getSpendLogsCount: vi.fn().mockResolvedValue(0),
    getSpendLogs: vi.fn().mockResolvedValue({
      logs: [],
      pagination: { total: 0, page: 1, page_size: 50, total_pages: 0 },
    }),
    getTokenDistribution: vi.fn().mockResolvedValue([]),
    getPerformanceMetrics: vi.fn().mockResolvedValue({
      total_requests: 0,
      avg_duration_ms: 0,
      success_rate: 0,
    }),
    getHourlyUsagePatterns: vi.fn().mockResolvedValue([]),
    getApiKeyStats: vi.fn().mockResolvedValue([]),
    getCostEfficiency: vi.fn().mockResolvedValue([]),
    getModelDistribution: vi.fn().mockResolvedValue([]),
    getDailyTokenTrend: vi.fn().mockResolvedValue([]),
    getModelStatistics: vi.fn().mockResolvedValue([]),
    getModels: vi.fn().mockResolvedValue([]),
    getModelDetails: vi.fn().mockResolvedValue([]),
    getErrorLogs: vi.fn().mockResolvedValue([]),
    createModel: vi.fn().mockResolvedValue(undefined),
    updateModel: vi.fn().mockResolvedValue(undefined),
    deleteModel: vi.fn().mockResolvedValue(undefined),
    mergeModels: vi.fn().mockResolvedValue(undefined),
    deleteModelLogs: vi.fn().mockResolvedValue(undefined),
    getAgentRoutingConfig: vi.fn().mockResolvedValue({}),
    updateAgentRoutingConfig: vi.fn().mockResolvedValue(undefined),
    getDailySpendTrendByModel: vi.fn().mockResolvedValue([]),
    getDailyTokenTrendByModel: vi.fn().mockResolvedValue([]),
    getHourlyUsageByModel: vi.fn().mockResolvedValue([]),
    getDailyLatencyTrendByModel: vi.fn().mockResolvedValue([]),
    getErrorBreakdownByModel: vi.fn().mockResolvedValue([]),
    getDailyErrorTrendByModel: vi.fn().mockResolvedValue([]),
    getTopUsersByModel: vi.fn().mockResolvedValue([]),
    getTopApiKeysByModel: vi.fn().mockResolvedValue([]),
    getSpendLogDetail: vi.fn().mockResolvedValue(null),
    getErrorsSince: vi.fn().mockResolvedValue([]),
    getErrorCountByModelSince: vi.fn().mockResolvedValue([]),
    getModelHealthSince: vi.fn().mockResolvedValue(null),
    getStuckRequests: vi.fn().mockResolvedValue([]),
    getCacheHitRateByModel: vi.fn().mockResolvedValue({
      cache_hits: 0,
      total_requests: 0,
      cache_hit_rate: 0,
    }),
    getTTFTPercentilesByModel: vi.fn().mockResolvedValue({
      avg_ttft_ms: 0,
      p50_ttft_ms: 0,
      p95_ttft_ms: 0,
      p99_ttft_ms: 0,
      min_ttft_ms: 0,
      max_ttft_ms: 0,
    }),
    getStatusDistributionByModel: vi.fn().mockResolvedValue([]),
    getProviderBreakdownByModel: vi.fn().mockResolvedValue([]),
  };

  return { ...base, ...overrides };
}
