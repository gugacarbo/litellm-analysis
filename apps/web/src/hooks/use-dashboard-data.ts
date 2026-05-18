import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAllDashboardQueries } from "./dashboard/dashboard-queries";
import { useFilter } from "@/shared/contexts/filter-context";
import { computeInsights } from "./use-dashboard-data/insights";
import type { RawMetrics } from "./use-dashboard-data/normalizers";
import {
  normalizeApiKeyStats,
  normalizeMetrics,
  normalizePerformance,
  normalizeSpendByUser,
} from "./use-dashboard-data/normalizers";

function toISODateString(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString();
}

export function useDashboardData() {
  const { dateRange, customFrom, customTo, rangeDays } = useFilter();
  const abortRef = useRef<AbortController>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    return () => {
      controller.abort();
    };
  }, []);

  const queryParams = useMemo(() => {
    if (dateRange === "custom" && customFrom && customTo) {
      return {
        startDate: toISODateString(customFrom),
        endDate: toISODateString(customTo),
      };
    }
    return { days: rangeDays };
  }, [dateRange, customFrom, customTo, rangeDays]);

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
    modelStatisticsQuery,
  } = useAllDashboardQueries(queryParams);

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
    modelStatisticsQuery,
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
  const modelStatistics = modelStatisticsQuery.data ?? [];

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
        modelStatisticsQuery.refetch(),
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
      modelStatisticsQuery,
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
    modelStatistics,
    lastUpdatedAt,
    insights,
    refetch,
  };
}
