import { useQuery } from "@tanstack/react-query";
import {
  getApiKeyDetailedStats,
  getCostEfficiencyByModel,
  getDailySpendTrend,
  getDailyTokenTrend,
  getHourlyUsagePatterns,
  getMetricsSummary,
  getModelRequestDistribution,
  getPerformanceMetrics,
  getSpendByModel,
  getSpendByUser,
  getTokenDistribution,
} from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";

const DEFAULT_DAYS = 30;
const AUTO_REFRESH_MS = 30_000;
export function useDashboardMetricsQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardMetrics(days),
    queryFn: () => getMetricsSummary(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function useSpendByModelQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardSpendByModel(days),
    queryFn: () => getSpendByModel(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function useSpendByUserQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardSpendByUser(days),
    queryFn: () => getSpendByUser(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function useDailyTrendQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardDailySpendTrend(days),
    queryFn: () => getDailySpendTrend(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function useTokenDistributionQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardTokenDistribution(days),
    queryFn: () => getTokenDistribution(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function usePerformanceQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardPerformance(days),
    queryFn: () => getPerformanceMetrics(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function useHourlyPatternsQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardHourlyPatterns(days),
    queryFn: () => getHourlyUsagePatterns(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function useApiKeyStatsQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardApiKeyStats(days),
    queryFn: () => getApiKeyDetailedStats(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function useCostEfficiencyQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardCostEfficiency(days),
    queryFn: () => getCostEfficiencyByModel(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function useModelDistributionQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardModelDistribution(days),
    queryFn: () => getModelRequestDistribution(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export function useDailyTokenTrendQuery(days = DEFAULT_DAYS) {
  return useQuery({
    queryKey: queryKeys.dashboardDailyTokenTrend(days),
    queryFn: () => getDailyTokenTrend(days),
    refetchInterval: AUTO_REFRESH_MS,
  });
}
export const ALL_DASHBOARD_QUERY_NAMES = [
  "metricsQuery",
  "spendByModelQuery",
  "spendByUserQuery",
  "dailyTrendQuery",
  "tokenDistributionQuery",
  "performanceQuery",
  "hourlyPatternsQuery",
  "apiKeyStatsQuery",
  "costEfficiencyQuery",
  "modelDistributionQuery",
  "dailyTokenTrendQuery",
];
export function useAllDashboardQueries(options = {}) {
  const days = options.days ?? 30;
  const metricsQuery = useDashboardMetricsQuery(days);
  const spendByModelQuery = useSpendByModelQuery(days);
  const spendByUserQuery = useSpendByUserQuery(days);
  const dailyTrendQuery = useDailyTrendQuery(days);
  const tokenDistributionQuery = useTokenDistributionQuery(days);
  const performanceQuery = usePerformanceQuery(days);
  const hourlyPatternsQuery = useHourlyPatternsQuery(days);
  const apiKeyStatsQuery = useApiKeyStatsQuery(days);
  const costEfficiencyQuery = useCostEfficiencyQuery(days);
  const modelDistributionQuery = useModelDistributionQuery(days);
  const dailyTokenTrendQuery = useDailyTokenTrendQuery(days);
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
  };
}
