import type { AnalyticsDataSource, SpendLogsFilters } from "../types/index";
import { DatabaseDataSource } from "./database";
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
  getProxySpendLogDetailImpl,
  getProxySpendLogsCountImpl,
  getProxySpendLogsImpl,
} from "./proxy-spend-methods";
import {
  getAgentRoutingConfigImpl,
  updateAgentRoutingConfigImpl,
} from "./routing-methods";

export class ModelProxyDataSource implements AnalyticsDataSource {
  private readonly registryDelegate = new DatabaseDataSource();

  getSpendLogsCount = getProxySpendLogsCountImpl;
  getSpendLogs = (filters: SpendLogsFilters) =>
    getProxySpendLogsImpl(filters, this.getSpendLogsCount);
  getSpendLogDetail = getProxySpendLogDetailImpl;

  getSpendByUser = async () => [];
  getSpendByKey = async () => [];
  getApiKeyStats = async () => [];
  getTopUsersByModel = async () => [];
  getTopApiKeysByModel = async () => [];

  getModels = () => this.registryDelegate.getModels();
  getModelDetails = () => this.registryDelegate.getModelDetails();
  createModel = (...args: Parameters<AnalyticsDataSource["createModel"]>) =>
    this.registryDelegate.createModel(...args);
  updateModel = (...args: Parameters<AnalyticsDataSource["updateModel"]>) =>
    this.registryDelegate.updateModel(...args);
  deleteModel = (...args: Parameters<AnalyticsDataSource["deleteModel"]>) =>
    this.registryDelegate.deleteModel(...args);
  getCredentials = () => this.registryDelegate.getCredentials();
  getDefaultCredential = () => this.registryDelegate.getDefaultCredential();
  getHealthCheckPrompt = () => this.registryDelegate.getHealthCheckPrompt();
  setDefaultCredential = (
    ...args: Parameters<AnalyticsDataSource["setDefaultCredential"]>
  ) => this.registryDelegate.setDefaultCredential(...args);
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
