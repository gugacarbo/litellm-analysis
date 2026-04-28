import { useCallback, useMemo } from "react";
import { useAllDashboardQueries } from "./dashboard/dashboard-queries";
import { computeInsights } from "./use-dashboard-data/insights";
import type { RawMetrics } from "./use-dashboard-data/normalizers";
import {
  normalizeApiKeyStats,
  normalizeMetrics,
  normalizePerformance,
  normalizeSpendByUser,
} from "./use-dashboard-data/normalizers";

const DEFAULT_DAYS = 30;

type DashboardDataOptions = {
  days?: number;
};

export function useDashboardData(options: DashboardDataOptions = {}) {
  const days = options.days ?? DEFAULT_DAYS;

  const {
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
  } = useAllDashboardQueries({ days });

  const dashboardQueries = [
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
  ];

  const metrics =
    metricsQuery.data === undefined
      ? null
      : normalizeMetrics(metricsQuery.data as RawMetrics);
  const spendByModel = spendByModelQuery.data ?? [];
  const spendByUser = normalizeSpendByUser(spendByUserQuery.data ?? []);
  const dailyTrend = dailyTrendQuery.data ?? [];
  const tokenDistribution = tokenDistributionQuery.data ?? [];
  const performance =
    performanceQuery.data === undefined
      ? null
      : normalizePerformance(performanceQuery.data);
  const hourlyPatterns = hourlyPatternsQuery.data ?? [];
  const apiKeyStats = normalizeApiKeyStats(apiKeyStatsQuery.data ?? []);
  const costEfficiency = costEfficiencyQuery.data ?? [];
  const modelDistribution = modelDistributionQuery.data ?? [];
  const dailyTokenTrend = dailyTokenTrendQuery.data ?? [];

  const successfulCount = dashboardQueries.filter(
    (query) => query.data !== undefined,
  ).length;
  const firstError = dashboardQueries.find(
    (query) => query.error instanceof Error,
  )?.error;

  const loading =
    successfulCount === 0 && dashboardQueries.some((q) => q.isPending);
  const refreshing = !loading && dashboardQueries.some((q) => q.isFetching);

  const latestUpdateTimestamp = Math.max(
    ...dashboardQueries
      .filter((query) => query.data !== undefined)
      .map((query) => query.dataUpdatedAt),
    0,
  );

  const lastUpdatedAt =
    latestUpdateTimestamp > 0 ? new Date(latestUpdateTimestamp) : null;

  const refetch = useCallback(
    async (_options?: { background?: boolean }) => {
      await Promise.all([
        metricsQuery.refetch(),
        spendByModelQuery.refetch(),
        spendByUserQuery.refetch(),
        dailyTrendQuery.refetch(),
        tokenDistributionQuery.refetch(),
        performanceQuery.refetch(),
        hourlyPatternsQuery.refetch(),
        apiKeyStatsQuery.refetch(),
        costEfficiencyQuery.refetch(),
        modelDistributionQuery.refetch(),
        dailyTokenTrendQuery.refetch(),
      ]);
    },
    [
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
    ],
  );

  const insights = useMemo(
    () =>
      computeInsights(
        metrics,
        performance,
        hourlyPatterns,
        dailyTokenTrend,
        dailyTrend,
      ),
    [metrics, performance, hourlyPatterns, dailyTokenTrend, dailyTrend],
  );

  return {
    metrics,
    spendByModel,
    spendByUser,
    dailyTrend,
    loading,
    refreshing,
    error:
      successfulCount === 0
        ? firstError instanceof Error
          ? firstError.message
          : "Failed to fetch dashboard data"
        : null,
    tokenDistribution,
    performance,
    hourlyPatterns,
    apiKeyStats,
    costEfficiency,
    modelDistribution,
    dailyTokenTrend,
    lastUpdatedAt,
    insights,
    refetch,
  };
}
