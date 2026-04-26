import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
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
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type {
  ApiKeyStatItem,
  DashboardInsight,
  DashboardMetrics,
  PerformanceMetrics,
  SpendByUserItem,
} from "../pages/dashboard/dashboard-types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  normalizePercent,
  safeDivide,
} from "../pages/dashboard/dashboard-utils";

const DEFAULT_DAYS = 30;
const AUTO_REFRESH_MS = 30_000;

type DashboardDataOptions = {
  days?: number;
};

type RawMetrics = {
  totalSpend?: number;
  totalTokens?: number;
  activeModels?: number;
  errorCount?: number;
  total_spend?: number;
  total_tokens?: number;
  active_models?: number;
  error_count?: number;
};

function normalizeMetrics(
  raw: RawMetrics | null | undefined,
): DashboardMetrics {
  return {
    totalSpend: Number(raw?.totalSpend ?? raw?.total_spend ?? 0),
    totalTokens: Number(raw?.totalTokens ?? raw?.total_tokens ?? 0),
    activeModels: Number(raw?.activeModels ?? raw?.active_models ?? 0),
    errorCount: Number(raw?.errorCount ?? raw?.error_count ?? 0),
  };
}

function normalizePerformance(
  raw: PerformanceMetrics | null | undefined,
): PerformanceMetrics {
  return {
    total_requests: Number(raw?.total_requests ?? 0),
    avg_duration_ms: Number(raw?.avg_duration_ms ?? 0),
    success_rate: normalizePercent(Number(raw?.success_rate ?? 0)),
  };
}

function normalizeApiKeyStats(apiKeyStats: ApiKeyStatItem[]): ApiKeyStatItem[] {
  return apiKeyStats.map((keyStats) => ({
    ...keyStats,
    key: keyStats.key || "Unknown",
    success_rate: normalizePercent(Number(keyStats.success_rate ?? 0)),
  }));
}

function normalizeSpendByUser(
  spendByUser: SpendByUserItem[],
): SpendByUserItem[] {
  return spendByUser.map((item) => ({
    user: item.user || "Anonymous",
    total_spend: Number(item.total_spend ?? 0),
    total_tokens: Number(item.total_tokens ?? 0),
    request_count: Number(item.request_count ?? 0),
  }));
}

function getToneByDelta(value: number): DashboardInsight["tone"] {
  if (value > 10) {
    return "warning";
  }
  if (value < -10) {
    return "positive";
  }
  return "neutral";
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  const days = options.days ?? DEFAULT_DAYS;

  const metricsQuery = useQuery({
    queryKey: queryKeys.dashboardMetrics(days),
    queryFn: () => getMetricsSummary(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const spendByModelQuery = useQuery({
    queryKey: queryKeys.dashboardSpendByModel(days),
    queryFn: () => getSpendByModel(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const spendByUserQuery = useQuery({
    queryKey: queryKeys.dashboardSpendByUser(days),
    queryFn: () => getSpendByUser(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const dailyTrendQuery = useQuery({
    queryKey: queryKeys.dashboardDailySpendTrend(days),
    queryFn: () => getDailySpendTrend(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const tokenDistributionQuery = useQuery({
    queryKey: queryKeys.dashboardTokenDistribution(days),
    queryFn: () => getTokenDistribution(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const performanceQuery = useQuery({
    queryKey: queryKeys.dashboardPerformance(days),
    queryFn: () => getPerformanceMetrics(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const hourlyPatternsQuery = useQuery({
    queryKey: queryKeys.dashboardHourlyPatterns(days),
    queryFn: () => getHourlyUsagePatterns(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const apiKeyStatsQuery = useQuery({
    queryKey: queryKeys.dashboardApiKeyStats(days),
    queryFn: () => getApiKeyDetailedStats(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const costEfficiencyQuery = useQuery({
    queryKey: queryKeys.dashboardCostEfficiency(days),
    queryFn: () => getCostEfficiencyByModel(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const modelDistributionQuery = useQuery({
    queryKey: queryKeys.dashboardModelDistribution(days),
    queryFn: () => getModelRequestDistribution(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

  const dailyTokenTrendQuery = useQuery({
    queryKey: queryKeys.dashboardDailyTokenTrend(days),
    queryFn: () => getDailyTokenTrend(days),
    refetchInterval: AUTO_REFRESH_MS,
  });

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

  const insights = useMemo<DashboardInsight[]>(() => {
    const totalSpend = metrics?.totalSpend ?? 0;
    const totalTokens = metrics?.totalTokens ?? 0;
    const totalRequests = performance?.total_requests ?? 0;

    const avgCostPerRequest = safeDivide(totalSpend, totalRequests);
    const avgCostPer1kTokens = safeDivide(totalSpend, totalTokens) * 1000;

    const peakHour = [...hourlyPatterns].sort(
      (a, b) => b.request_count - a.request_count,
    )[0];

    const totalInputTokens = dailyTokenTrend.reduce(
      (sum, day) => sum + Number(day.prompt_tokens || 0),
      0,
    );
    const totalOutputTokens = dailyTokenTrend.reduce(
      (sum, day) => sum + Number(day.completion_tokens || 0),
      0,
    );
    const outputShare =
      safeDivide(totalOutputTokens, totalInputTokens + totalOutputTokens) * 100;

    const recentWindow = dailyTrend.slice(-7);
    const previousWindow = dailyTrend.slice(-14, -7);
    const recentSpend = recentWindow.reduce(
      (sum, day) => sum + Number(day.spend || 0),
      0,
    );
    const previousSpend = previousWindow.reduce(
      (sum, day) => sum + Number(day.spend || 0),
      0,
    );

    const momentum =
      previousSpend > 0
        ? ((recentSpend - previousSpend) / previousSpend) * 100
        : 0;

    return [
      {
        title: "Avg cost per request",
        value: formatCurrency(avgCostPerRequest),
        detail: `${formatNumber(totalRequests)} total requests`,
        tone: "neutral",
      },
      {
        title: "Avg cost per 1K tokens",
        value: formatCurrency(avgCostPer1kTokens),
        detail: `${formatNumber(totalTokens)} tokens in selected range`,
        tone: "neutral",
      },
      {
        title: "Peak usage hour",
        value: peakHour ? `${peakHour.hour}:00` : "--",
        detail: peakHour
          ? `${formatNumber(peakHour.request_count)} requests`
          : "No hourly requests in selected range",
        tone: "positive",
      },
      {
        title: "Output token share",
        value: formatPercent(outputShare),
        detail: "Completion tokens over total token volume",
        tone: outputShare > 65 ? "warning" : "neutral",
      },
      {
        title: "Spend momentum",
        value: `${momentum >= 0 ? "+" : ""}${formatPercent(momentum)}`,
        detail: "Last 7 days compared to previous 7 days",
        tone: getToneByDelta(momentum),
      },
    ];
  }, [dailyTokenTrend, dailyTrend, hourlyPatterns, metrics, performance]);

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
