import { useQuery } from "@tanstack/react-query";
import {
  getCostEfficiencyByModel,
  getModelRequestDistribution,
  getModelStatistics,
  getTokenDistribution,
} from "../lib/api-client/analytics";
import {
  getModelDailyErrors,
  getModelDailySpend,
  getModelDailyTokens,
  getModelErrorBreakdown,
  getModelHourlyUsage,
  getModelLatencyTrend,
  getModelTopApiKeys,
  getModelTopUsers,
} from "../lib/api-client/model-analytics";
import { queryKeys } from "../lib/query-keys";

const AUTO_REFRESH_MS = 30_000;

export function useModelStatsQuery(days: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.modelStatistics(days),
    queryFn: () => getModelStatistics(days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useDailySpendQuery(
  modelName: string,
  days: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.modelDetailDailySpend(modelName, days),
    queryFn: () => getModelDailySpend(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useDailyTokensQuery(
  modelName: string,
  days: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.modelDetailDailyTokens(modelName, days),
    queryFn: () => getModelDailyTokens(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useLatencyTrendQuery(
  modelName: string,
  days: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.modelDetailLatencyTrend(modelName, days),
    queryFn: () => getModelLatencyTrend(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useErrorBreakdownQuery(
  modelName: string,
  days: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.modelDetailErrorBreakdown(modelName, days),
    queryFn: () => getModelErrorBreakdown(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useDailyErrorsQuery(
  modelName: string,
  days: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.modelDetailDailyErrors(modelName, days),
    queryFn: () => getModelDailyErrors(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useHourlyUsageQuery(
  modelName: string,
  days: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.modelDetailHourlyUsage(modelName, days),
    queryFn: () => getModelHourlyUsage(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useTokenDistQuery(days: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.dashboardTokenDistribution(days),
    queryFn: () => getTokenDistribution(days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useModelDistQuery(days: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.dashboardModelDistribution(days),
    queryFn: () => getModelRequestDistribution(days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useCostEffQuery(days: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.dashboardCostEfficiency(days),
    queryFn: () => getCostEfficiencyByModel(days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useTopUsersQuery(
  modelName: string,
  days: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.modelDetailTopUsers(modelName, days),
    queryFn: () => getModelTopUsers(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}

export function useTopApiKeysQuery(
  modelName: string,
  days: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.modelDetailTopApiKeys(modelName, days),
    queryFn: () => getModelTopApiKeys(modelName, days),
    refetchInterval: AUTO_REFRESH_MS,
    enabled,
  });
}
