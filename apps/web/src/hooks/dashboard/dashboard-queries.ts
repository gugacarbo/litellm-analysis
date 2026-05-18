import { useQuery } from "@tanstack/react-query";
import type { AnalyticsQueryParams } from "@/shared/lib/api-client/analytics";
import {
  getApiKeyDetailedStats,
  getCostEfficiencyByModel,
  getDailyTokenTrend,
  getHourlyUsagePatterns,
  getMetricsSummary,
  getModelRequestDistribution,
  getModelStatistics,
  getPerformanceMetrics,
  getTokenDistribution,
} from "@/shared/lib/api-client/analytics";
import {
  getDailySpendTrend,
  getSpendByModel,
  getSpendByUser,
} from "@/shared/lib/api-client/spend";
import { queryKeys } from "@/shared/lib/query-keys";

const AUTO_REFRESH_MS = 30_000;

function useDashboardMetricsQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardMetrics(params.days ?? 30),
    queryFn: () => getMetricsSummary(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useSpendByModelQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardSpendByModel(params.days ?? 30),
    queryFn: () => getSpendByModel(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useSpendByUserQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardSpendByUser(params.days ?? 30),
    queryFn: () => getSpendByUser(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useDailyTrendQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardDailySpendTrend(params.days ?? 30),
    queryFn: () => getDailySpendTrend(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useTokenDistributionQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardTokenDistribution(params.days ?? 30),
    queryFn: () => getTokenDistribution(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function usePerformanceQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardPerformance(params.days ?? 30),
    queryFn: () => getPerformanceMetrics(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useHourlyPatternsQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardHourlyPatterns(params.days ?? 30),
    queryFn: () => getHourlyUsagePatterns(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useApiKeyStatsQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardApiKeyStats(params.days ?? 30),
    queryFn: () => getApiKeyDetailedStats(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useCostEfficiencyQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardCostEfficiency(params.days ?? 30),
    queryFn: () => getCostEfficiencyByModel(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useModelDistributionQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardModelDistribution(params.days ?? 30),
    queryFn: () => getModelRequestDistribution(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useDailyTokenTrendQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardDailyTokenTrend(params.days ?? 30),
    queryFn: () => getDailyTokenTrend(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

function useModelStatisticsQuery(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardModelStatistics(params.days ?? 30),
    queryFn: () => getModelStatistics(params),
    refetchInterval: AUTO_REFRESH_MS,
  });
}

export function useAllDashboardQueries(params: AnalyticsQueryParams = {}) {
  const metricsQuery = useDashboardMetricsQuery(params);
  const spendByModelQuery = useSpendByModelQuery(params);
  const spendByUserQuery = useSpendByUserQuery(params);
  const dailyTrendQuery = useDailyTrendQuery(params);
  const tokenDistributionQuery = useTokenDistributionQuery(params);
  const performanceQuery = usePerformanceQuery(params);
  const hourlyPatternsQuery = useHourlyPatternsQuery(params);
  const apiKeyStatsQuery = useApiKeyStatsQuery(params);
  const costEfficiencyQuery = useCostEfficiencyQuery(params);
  const modelDistributionQuery = useModelDistributionQuery(params);
  const dailyTokenTrendQuery = useDailyTokenTrendQuery(params);
  const modelStatisticsQuery = useModelStatisticsQuery(params);

  return {
    metricsQuery,
    spendByModelQuery,
    spendByUserQuery,
    dailyTrendQuery,
    tokenDistributionQuery,
    performanceQuery,
    hourlyPatternsQuery,
    apiKeyStatsQuery,
    costEfficiencyQuery,
    modelDistributionQuery,
    dailyTokenTrendQuery,
    modelStatisticsQuery,
  };
}
