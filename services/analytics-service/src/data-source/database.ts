import type { AnalyticsDataSource, SpendLogsFilters } from "../types/index";
import {
  getHourlyUsagePatternsImpl,
  getPerformanceMetricsImpl,
  getTokenDistributionImpl,
} from "./analytics-methods";
import {
  getCredentialsImpl,
  getDefaultCredentialImpl,
  getHealthCheckPromptImpl,
  setDefaultCredentialImpl,
} from "./credential-methods";
import { getErrorLogsImpl } from "./error-methods";
import {
  getDailySpendTrendImpl,
  getHourlySpendTrendImpl,
  getMetricsSummaryImpl,
} from "./metrics-methods";
import {
  createModelImpl,
  deleteModelImpl,
  deleteModelLogsImpl,
  getCacheHitRateByModelImpl,
  getDailyErrorTrendByModelImpl,
  getDailyLatencyTrendByModelImpl,
  getDailySpendTrendByModelImpl,
  getDailyTokenTrendByModelImpl,
  getErrorBreakdownByModelImpl,
  getHourlyUsageByModelImpl,
  getModelDetailsImpl,
  getModelsImpl,
  getProviderBreakdownByModelImpl,
  getStatusDistributionByModelImpl,
  getTopApiKeysByModelImpl,
  getTopUsersByModelImpl,
  getTTFTPercentilesByModelImpl,
  mergeModelsImpl,
  updateModelImpl,
} from "./model-methods";
import {
  getErrorCountByModelSinceImpl,
  getErrorsSinceImpl,
  getLowThroughputRequestsSinceImpl,
  getModelHealthSinceImpl,
  getNonSuccessCountByModelSinceImpl,
  getNonSuccessLogsSinceImpl,
  getSpendAnomaliesSinceImpl,
  getSpendByModelSinceImpl,
  getStuckRequestsImpl,
} from "./monitor-methods";
import {
  getAgentRoutingConfigImpl,
  updateAgentRoutingConfigImpl,
} from "./routing-methods";
import {
  getSpendByKeyImpl,
  getSpendByModelImpl,
  getSpendByUserImpl,
  getSpendLogDetailImpl,
  getSpendLogsCountImpl,
  getSpendLogsImpl,
} from "./spend-methods";
import {
  getApiKeyStatsImpl,
  getCostEfficiencyImpl,
  getDailyTokenTrendImpl,
  getModelDistributionImpl,
  getModelStatisticsImpl,
} from "./stats-methods";

export class DatabaseDataSource implements AnalyticsDataSource {
  getMetricsSummary = getMetricsSummaryImpl;
  getDailySpendTrend = getDailySpendTrendImpl;
  getHourlySpendTrend = getHourlySpendTrendImpl;
  getSpendByModel = getSpendByModelImpl;
  getSpendByUser = getSpendByUserImpl;
  getSpendByKey = getSpendByKeyImpl;
  getSpendLogsCount = getSpendLogsCountImpl;
  getSpendLogs = (filters: SpendLogsFilters) =>
    getSpendLogsImpl(filters, this.getSpendLogsCount);
  getTokenDistribution = getTokenDistributionImpl;
  getSpendLogDetail = getSpendLogDetailImpl;
  getPerformanceMetrics = getPerformanceMetricsImpl;
  getHourlyUsagePatterns = getHourlyUsagePatternsImpl;
  getApiKeyStats = getApiKeyStatsImpl;
  getCostEfficiency = getCostEfficiencyImpl;
  getModelDistribution = getModelDistributionImpl;
  getDailyTokenTrend = getDailyTokenTrendImpl;
  getModelStatistics = getModelStatisticsImpl;
  getDailySpendTrendByModel = getDailySpendTrendByModelImpl;
  getDailyTokenTrendByModel = getDailyTokenTrendByModelImpl;
  getHourlyUsageByModel = getHourlyUsageByModelImpl;
  getDailyLatencyTrendByModel = getDailyLatencyTrendByModelImpl;
  getErrorBreakdownByModel = getErrorBreakdownByModelImpl;
  getDailyErrorTrendByModel = getDailyErrorTrendByModelImpl;
  getModels = getModelsImpl;
  getModelDetails = getModelDetailsImpl;
  getErrorLogs = getErrorLogsImpl;
  createModel = createModelImpl;
  updateModel = updateModelImpl;
  deleteModel = deleteModelImpl;
  mergeModels = mergeModelsImpl;
  deleteModelLogs = deleteModelLogsImpl;
  getAgentRoutingConfig = getAgentRoutingConfigImpl;
  updateAgentRoutingConfig = updateAgentRoutingConfigImpl;
  getTopUsersByModel = getTopUsersByModelImpl;
  getTopApiKeysByModel = getTopApiKeysByModelImpl;
  getErrorsSince = getErrorsSinceImpl;
  getErrorCountByModelSince = getErrorCountByModelSinceImpl;
  getModelHealthSince = getModelHealthSinceImpl;
  getStuckRequests = getStuckRequestsImpl;
  getSpendAnomaliesSince = getSpendAnomaliesSinceImpl;
  getSpendByModelSince = getSpendByModelSinceImpl;
  getNonSuccessLogsSince = getNonSuccessLogsSinceImpl;
  getNonSuccessCountByModelSince = getNonSuccessCountByModelSinceImpl;
  getLowThroughputRequestsSince = getLowThroughputRequestsSinceImpl;
  getCacheHitRateByModel = getCacheHitRateByModelImpl;
  getTTFTPercentilesByModel = getTTFTPercentilesByModelImpl;
  getStatusDistributionByModel = getStatusDistributionByModelImpl;
  getProviderBreakdownByModel = getProviderBreakdownByModelImpl;
  getCredentials = getCredentialsImpl;
  getDefaultCredential = getDefaultCredentialImpl;
  getHealthCheckPrompt = getHealthCheckPromptImpl;
  setDefaultCredential = setDefaultCredentialImpl;
}
