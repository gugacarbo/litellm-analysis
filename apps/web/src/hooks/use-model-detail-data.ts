import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getCostEfficiencyByModel,
  getModelDailyErrors,
  getModelDailySpend,
  getModelDailyTokens,
  getModelErrorBreakdown,
  getModelHourlyUsage,
  getModelLatencyTrend,
  getModelRequestDistribution,
  getModelStatistics,
  getModelTopApiKeys,
  getModelTopUsers,
  getTokenDistribution,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type {
  ModelDailyErrorTrend,
  ModelDailyLatencyTrend,
  ModelDailySpendTrend,
  ModelDailyTokenTrend,
  ModelDetailSummary,
  ModelErrorBreakdown,
  ModelHourlyUsage,
} from "../pages/model-detail/model-detail-types";

const DEFAULT_DAYS = 30;
const AUTO_REFRESH_MS = 30_000;

export function useModelDetailData(modelName: string, days = DEFAULT_DAYS) {
  const modelStatsQuery = useQuery({
    queryKey: queryKeys.modelStatistics(days),
    queryFn: () => getModelStatistics(days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const dailySpendQuery = useQuery({
    queryKey: queryKeys.modelDetailDailySpend(modelName, days),
    queryFn: () => getModelDailySpend(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const dailyTokensQuery = useQuery({
    queryKey: queryKeys.modelDetailDailyTokens(modelName, days),
    queryFn: () => getModelDailyTokens(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const latencyTrendQuery = useQuery({
    queryKey: queryKeys.modelDetailLatencyTrend(modelName, days),
    queryFn: () => getModelLatencyTrend(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const errorBreakdownQuery = useQuery({
    queryKey: queryKeys.modelDetailErrorBreakdown(modelName, days),
    queryFn: () => getModelErrorBreakdown(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const dailyErrorsQuery = useQuery({
    queryKey: queryKeys.modelDetailDailyErrors(modelName, days),
    queryFn: () => getModelDailyErrors(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const hourlyUsageQuery = useQuery({
    queryKey: queryKeys.modelDetailHourlyUsage(modelName, days),
    queryFn: () => getModelHourlyUsage(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const tokenDistQuery = useQuery({
    queryKey: queryKeys.dashboardTokenDistribution(days),
    queryFn: () => getTokenDistribution(days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const modelDistQuery = useQuery({
    queryKey: queryKeys.dashboardModelDistribution(days),
    queryFn: () => getModelRequestDistribution(days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const costEffQuery = useQuery({
    queryKey: queryKeys.dashboardCostEfficiency(days),
    queryFn: () => getCostEfficiencyByModel(days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const topUsersQuery = useQuery({
    queryKey: queryKeys.modelDetailTopUsers(modelName, days),
    queryFn: () => getModelTopUsers(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const topApiKeysQuery = useQuery({
    queryKey: queryKeys.modelDetailTopApiKeys(modelName, days),
    queryFn: () => getModelTopApiKeys(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled: !!modelName,
  });

  const allQueries = [
    modelStatsQuery,
    dailySpendQuery,
    dailyTokensQuery,
    latencyTrendQuery,
    errorBreakdownQuery,
    dailyErrorsQuery,
    hourlyUsageQuery,
  ];

  const loading =
    !!modelName &&
    allQueries.every((q) => q.isPending) &&
    allQueries.every((q) => q.data === undefined);

  const firstError = allQueries.find((q) => q.error instanceof Error)?.error;

  const error = firstError instanceof Error ? firstError.message : null;

  const modelStats = modelStatsQuery.data ?? [];
  const modelData = modelStats.find((m) => m.model === modelName);

  const summary = useMemo<ModelDetailSummary | null>(() => {
    if (!modelData) return null;
    const totalSpend = modelStats.reduce(
      (sum, m) => sum + Number(m.total_spend),
      0,
    );
    return {
      model: modelData.model,
      totalSpend: Number(modelData.total_spend),
      totalRequests: Number(modelData.request_count),
      totalTokens: Number(modelData.total_tokens),
      promptTokens: Number(modelData.prompt_tokens),
      completionTokens: Number(modelData.completion_tokens),
      avgLatencyMs: Number(modelData.avg_latency_ms || 0),
      p50LatencyMs: Number(modelData.p50_latency_ms || 0),
      p95LatencyMs: Number(modelData.p95_latency_ms || 0),
      p99LatencyMs: Number(modelData.p99_latency_ms || 0),
      successRate: Number(modelData.success_rate || 0),
      errorCount: Number(modelData.error_count || 0),
      firstSeen: modelData.first_seen ?? "",
      lastSeen: modelData.last_seen ?? "",
      rank: modelStats.findIndex((m) => m.model === modelName) + 1,
      percentOfTotal:
        totalSpend > 0 ? (Number(modelData.total_spend) / totalSpend) * 100 : 0,
      uniqueUsers: Number(modelData.unique_users || 0),
      uniqueApiKeys: Number(modelData.unique_api_keys || 0),
      costPer1kTokens:
        Number(modelData.total_tokens || 0) > 0
          ? (Number(modelData.total_spend) / Number(modelData.total_tokens)) *
            1000
          : 0,
    };
  }, [modelData, modelStats, modelName]);

  const dailySpendTrend = useMemo<ModelDailySpendTrend[]>(
    () =>
      (dailySpendQuery.data ?? []).map((item) => ({
        date: String(item.date),
        spend: Number(item.spend),
        totalTokens: Number(item.total_tokens),
        requestCount: Number(item.request_count),
      })),
    [dailySpendQuery.data],
  );

  const dailyTokenTrend = useMemo<ModelDailyTokenTrend[]>(
    () =>
      (dailyTokensQuery.data ?? []).map((item) => ({
        date: String(item.date),
        promptTokens: Number(item.prompt_tokens),
        completionTokens: Number(item.completion_tokens),
        totalTokens: Number(item.total_tokens),
      })),
    [dailyTokensQuery.data],
  );

  const latencyTrend = useMemo<ModelDailyLatencyTrend[]>(
    () =>
      (latencyTrendQuery.data ?? []).map((item) => ({
        date: String(item.date),
        avgLatencyMs: Number(item.avg_latency_ms || 0),
        p50LatencyMs: Number(item.p50_latency_ms || 0),
        p95LatencyMs: Number(item.p95_latency_ms || 0),
        p99LatencyMs: Number(item.p99_latency_ms || 0),
      })),
    [latencyTrendQuery.data],
  );

  const hourlyUsage = useMemo<ModelHourlyUsage[]>(
    () =>
      (hourlyUsageQuery.data ?? []).map((item) => ({
        hour: Number(item.hour),
        requestCount: Number(item.request_count),
        totalSpend: Number(item.total_spend),
        totalTokens: Number(item.total_tokens),
      })),
    [hourlyUsageQuery.data],
  );

  const errorBreakdown = useMemo<ModelErrorBreakdown[]>(
    () =>
      (errorBreakdownQuery.data ?? []).map((item) => ({
        errorType: String(item.error_type ?? ""),
        count: Number(item.count),
        lastOccurred: item.last_occurred ?? "",
      })),
    [errorBreakdownQuery.data],
  );

  const dailyErrorTrend = useMemo<ModelDailyErrorTrend[]>(
    () =>
      (dailyErrorsQuery.data ?? []).map((item) => ({
        date: String(item.date),
        errorCount: Number(item.error_count),
      })),
    [dailyErrorsQuery.data],
  );

  return {
    summary,
    dailySpendTrend,
    dailyTokenTrend,
    latencyTrend,
    hourlyUsage,
    errorBreakdown,
    dailyErrorTrend,
    topUsers: (topUsersQuery.data ?? []).map((item) => ({
      user: item.user ?? "",
      totalSpend: Number(item.total_spend),
      totalTokens: Number(item.total_tokens),
      requestCount: Number(item.request_count),
    })),
    topApiKeys: (topApiKeysQuery.data ?? []).map((item) => ({
      apiKey: item.api_key ?? "",
      totalSpend: Number(item.total_spend),
      totalTokens: Number(item.total_tokens),
      requestCount: Number(item.request_count),
      successRate: Number(item.success_rate),
    })),
    loading,
    error,
    tokenDistribution: tokenDistQuery.data ?? [],
    modelDistribution: modelDistQuery.data ?? [],
    costEfficiency: costEffQuery.data ?? [],
  };
}
