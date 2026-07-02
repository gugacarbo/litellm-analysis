import type { AnalyticsDataSource, SpendLogsFilters } from "../types/index";
import {
  getProxyCostEfficiencyImpl,
  getProxyDailySpendTrendImpl,
  getProxyDailyTokenTrendImpl,
  getProxyHourlySpendTrendImpl,
  getProxyHourlyUsagePatternsImpl,
  getProxyMetricsSummaryImpl,
  getProxyModelDistributionImpl,
  getProxyPerformanceMetricsImpl,
  getProxySpendByModelImpl,
  getProxyTokenDistributionImpl,
} from "./proxy-dashboard-methods";
import { getProxyErrorLogsImpl } from "./proxy-error-methods";
import {
  deleteModelLogsImpl,
  getCacheHitRateByModelImpl,
  getDailyErrorTrendByModelImpl,
  getDailyLatencyTrendByModelImpl,
  getDailySpendTrendByModelImpl,
  getDailyTokenTrendByModelImpl,
  getErrorBreakdownByModelImpl,
  getHourlyUsageByModelImpl,
  getProviderBreakdownByModelImpl,
  getProxyModelStatisticsImpl,
  getProxyTopApiKeysByModelImpl,
  getProxyTopUsersByModelImpl,
  getStatusDistributionByModelImpl,
  getTTFTPercentilesByModelImpl,
  mergeModelsImpl,
} from "./proxy-model-methods";
import {
  getProxyErrorCountByModelSinceImpl,
  getProxyErrorsSinceImpl,
  getProxyModelHealthSinceImpl,
  getProxyNonSuccessCountByModelSinceImpl,
  getProxyStuckRequestsImpl,
} from "./proxy-monitor-methods";
import {
  getProxyApiKeyStatsImpl,
  getProxySpendByKeyImpl,
  getProxySpendByUserImpl,
  getProxySpendLogDetailImpl,
  getProxySpendLogsCountImpl,
  getProxySpendLogsImpl,
  getProxySpendTotalsImpl,
} from "./proxy-spend-methods";
import {
  createRegistryModelImpl,
  deleteRegistryModelImpl,
  getRegistryDefaultProviderImpl,
  getRegistryHealthCheckPromptImpl,
  getRegistryModelDetailsImpl,
  getRegistryModelsImpl,
  getRegistryProvidersImpl,
  setRegistryDefaultProviderImpl,
  updateRegistryModelImpl,
} from "./registry-methods";
import {
  getAgentRoutingConfigImpl,
  updateAgentRoutingConfigImpl,
} from "./routing-methods";

export class ModelProxyDataSource implements AnalyticsDataSource {
  getSpendLogsCount = getProxySpendLogsCountImpl;
  getSpendLogs = (filters: SpendLogsFilters) =>
    getProxySpendLogsImpl(filters, this.getSpendLogsCount);
  getSpendLogDetail = getProxySpendLogDetailImpl;
  getSpendTotals = getProxySpendTotalsImpl;

  getSpendByUser = getProxySpendByUserImpl;
  getSpendByKey = getProxySpendByKeyImpl;
  getApiKeyStats = getProxyApiKeyStatsImpl;
  getTopUsersByModel = getProxyTopUsersByModelImpl;
  getTopApiKeysByModel = getProxyTopApiKeysByModelImpl;

  getModels = getRegistryModelsImpl;
  getModelDetails = getRegistryModelDetailsImpl;
  createModel = createRegistryModelImpl;
  updateModel = updateRegistryModelImpl;
  deleteModel = deleteRegistryModelImpl;
  getProviders = getRegistryProvidersImpl;
  getDefaultProvider = getRegistryDefaultProviderImpl;
  getHealthCheckPrompt = getRegistryHealthCheckPromptImpl;
  setDefaultProvider = setRegistryDefaultProviderImpl;
  getAgentRoutingConfig = getAgentRoutingConfigImpl;
  updateAgentRoutingConfig = updateAgentRoutingConfigImpl;

  getMetricsSummary = getProxyMetricsSummaryImpl;
  getDailySpendTrend = getProxyDailySpendTrendImpl;
  getHourlySpendTrend = getProxyHourlySpendTrendImpl;
  getSpendByModel = getProxySpendByModelImpl;
  getTokenDistribution = getProxyTokenDistributionImpl;
  getPerformanceMetrics = getProxyPerformanceMetricsImpl;
  getHourlyUsagePatterns = getProxyHourlyUsagePatternsImpl;
  getCostEfficiency = getProxyCostEfficiencyImpl;
  getModelDistribution = getProxyModelDistributionImpl;
  getDailyTokenTrend = getProxyDailyTokenTrendImpl;
  getModelStatistics = getProxyModelStatisticsImpl;
  getDailySpendTrendByModel = getDailySpendTrendByModelImpl;
  getDailyTokenTrendByModel = getDailyTokenTrendByModelImpl;
  getHourlyUsageByModel = getHourlyUsageByModelImpl;
  getDailyLatencyTrendByModel = getDailyLatencyTrendByModelImpl;
  getErrorBreakdownByModel = getErrorBreakdownByModelImpl;
  getDailyErrorTrendByModel = getDailyErrorTrendByModelImpl;
  getErrorLogs = getProxyErrorLogsImpl;
  mergeModels = mergeModelsImpl;
  deleteModelLogs = deleteModelLogsImpl;
  getErrorsSince = getProxyErrorsSinceImpl;
  getErrorCountByModelSince = getProxyErrorCountByModelSinceImpl;
  getNonSuccessCountByModelSince = getProxyNonSuccessCountByModelSinceImpl;
  getModelHealthSince = getProxyModelHealthSinceImpl;
  getStuckRequests = getProxyStuckRequestsImpl;
  getCacheHitRateByModel = getCacheHitRateByModelImpl;
  getTTFTPercentilesByModel = getTTFTPercentilesByModelImpl;
  getStatusDistributionByModel = getStatusDistributionByModelImpl;
  getProviderBreakdownByModel = getProviderBreakdownByModelImpl;
}
