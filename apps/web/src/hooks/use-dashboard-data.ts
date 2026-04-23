import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '../lib/api-client';
import type {
  ApiKeyStatItem,
  CostEfficiencyItem,
  DailyTokenTrendItem,
  DailyTrendItem,
  DashboardInsight,
  DashboardMetrics,
  HourlyPatternItem,
  ModelDistributionItem,
  PerformanceMetrics,
  SpendByUserItem,
  TokenDistributionItem,
} from '../pages/dashboard/dashboard-types';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  normalizePercent,
  safeDivide,
} from '../pages/dashboard/dashboard-utils';

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
    key: keyStats.key || 'Unknown',
    success_rate: normalizePercent(Number(keyStats.success_rate ?? 0)),
  }));
}

function normalizeSpendByUser(
  spendByUser: SpendByUserItem[],
): SpendByUserItem[] {
  return spendByUser.map((item) => ({
    user: item.user || 'Anonymous',
    total_spend: Number(item.total_spend ?? 0),
    total_tokens: Number(item.total_tokens ?? 0),
    request_count: Number(item.request_count ?? 0),
  }));
}

function getToneByDelta(value: number): DashboardInsight['tone'] {
  if (value > 10) {
    return 'warning';
  }
  if (value < -10) {
    return 'positive';
  }
  return 'neutral';
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  const days = options.days ?? DEFAULT_DAYS;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [spendByModel, setSpendByModel] = useState<
    { model: string; total_spend: number }[]
  >([]);
  const [spendByUser, setSpendByUser] = useState<SpendByUserItem[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenDistribution, setTokenDistribution] = useState<
    TokenDistributionItem[]
  >([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(
    null,
  );
  const [hourlyPatterns, setHourlyPatterns] = useState<HourlyPatternItem[]>([]);
  const [apiKeyStats, setApiKeyStats] = useState<ApiKeyStatItem[]>([]);
  const [costEfficiency, setCostEfficiency] = useState<CostEfficiencyItem[]>(
    [],
  );
  const [modelDistribution, setModelDistribution] = useState<
    ModelDistributionItem[]
  >([]);
  const [dailyTokenTrend, setDailyTokenTrend] = useState<DailyTokenTrendItem[]>(
    [],
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const fetchData = useCallback(
    async (options?: { background?: boolean }) => {
      const background = options?.background ?? false;

      try {
        if (background) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const results = await Promise.allSettled([
          getMetricsSummary(days),
          getSpendByModel(days),
          getSpendByUser(days),
          getDailySpendTrend(days),
          getTokenDistribution(days),
          getPerformanceMetrics(days),
          getHourlyUsagePatterns(days),
          getApiKeyDetailedStats(days),
          getCostEfficiencyByModel(days),
          getModelRequestDistribution(days),
          getDailyTokenTrend(days),
        ]);

        const [
          metricsResult,
          spendByModelResult,
          spendByUserResult,
          dailyTrendResult,
          tokenDistributionResult,
          performanceResult,
          hourlyPatternsResult,
          apiKeyStatsResult,
          costEfficiencyResult,
          modelDistributionResult,
          dailyTokenTrendResult,
        ] = results;

        if (metricsResult.status === 'fulfilled') {
          setMetrics(normalizeMetrics(metricsResult.value));
        }
        if (spendByModelResult.status === 'fulfilled') {
          setSpendByModel(spendByModelResult.value);
        }
        if (spendByUserResult.status === 'fulfilled') {
          setSpendByUser(normalizeSpendByUser(spendByUserResult.value));
        }
        if (dailyTrendResult.status === 'fulfilled') {
          setDailyTrend(dailyTrendResult.value);
        }
        if (tokenDistributionResult.status === 'fulfilled') {
          setTokenDistribution(tokenDistributionResult.value);
        }
        if (performanceResult.status === 'fulfilled') {
          setPerformance(normalizePerformance(performanceResult.value));
        }
        if (hourlyPatternsResult.status === 'fulfilled') {
          setHourlyPatterns(hourlyPatternsResult.value);
        }
        if (apiKeyStatsResult.status === 'fulfilled') {
          setApiKeyStats(normalizeApiKeyStats(apiKeyStatsResult.value));
        }
        if (costEfficiencyResult.status === 'fulfilled') {
          setCostEfficiency(costEfficiencyResult.value);
        }
        if (modelDistributionResult.status === 'fulfilled') {
          setModelDistribution(modelDistributionResult.value);
        }
        if (dailyTokenTrendResult.status === 'fulfilled') {
          setDailyTokenTrend(dailyTokenTrendResult.value);
        }

        const successfulCount = results.filter(
          (result) => result.status === 'fulfilled',
        ).length;

        if (successfulCount === 0) {
          setError('Failed to fetch dashboard data');
        } else {
          setError(null);
          setLastUpdatedAt(new Date());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days],
  );

  useEffect(() => {
    void fetchData();

    const interval = window.setInterval(() => {
      void fetchData({ background: true });
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [fetchData]);

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
        title: 'Avg cost per request',
        value: formatCurrency(avgCostPerRequest),
        detail: `${formatNumber(totalRequests)} total requests`,
        tone: 'neutral',
      },
      {
        title: 'Avg cost per 1K tokens',
        value: formatCurrency(avgCostPer1kTokens),
        detail: `${formatNumber(totalTokens)} tokens in selected range`,
        tone: 'neutral',
      },
      {
        title: 'Peak usage hour',
        value: peakHour ? `${peakHour.hour}:00` : '--',
        detail: peakHour
          ? `${formatNumber(peakHour.request_count)} requests`
          : 'No hourly requests in selected range',
        tone: 'positive',
      },
      {
        title: 'Output token share',
        value: formatPercent(outputShare),
        detail: 'Completion tokens over total token volume',
        tone: outputShare > 65 ? 'warning' : 'neutral',
      },
      {
        title: 'Spend momentum',
        value: `${momentum >= 0 ? '+' : ''}${formatPercent(momentum)}`,
        detail: 'Last 7 days compared to previous 7 days',
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
    error,
    refetch: fetchData,
    tokenDistribution,
    performance,
    hourlyPatterns,
    apiKeyStats,
    costEfficiency,
    modelDistribution,
    dailyTokenTrend,
    lastUpdatedAt,
    insights,
  };
}
