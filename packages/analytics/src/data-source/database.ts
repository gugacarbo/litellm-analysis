import type { AnalyticsDataSource, SpendLogsFilters } from "../types/index.js";
import {
  getHourlyUsagePatternsImpl,
  getPerformanceMetricsImpl,
  getTokenDistributionImpl,
} from "./analytics-methods.js";
import {
  deleteAgentConfigImpl,
  deleteCategoryConfigImpl,
  getAgentConfigsImpl,
  getCategoryConfigsImpl,
  updateAgentConfigImpl,
  updateCategoryConfigImpl,
} from "./config-methods.js";
import { getErrorLogsImpl } from "./error-methods.js";
import {
  getDailySpendTrendImpl,
  getMetricsSummaryImpl,
} from "./metrics-methods.js";
import {
  createModelImpl,
  deleteModelImpl,
  deleteModelLogsImpl,
  getModelDetailsImpl,
  getModelsImpl,
  mergeModelsImpl,
  updateModelImpl,
} from "./model-methods.js";
import {
  getAgentRoutingConfigImpl,
  updateAgentRoutingConfigImpl,
} from "./routing-methods.js";
import {
  getSpendByKeyImpl,
  getSpendByModelImpl,
  getSpendByUserImpl,
  getSpendLogsCountImpl,
  getSpendLogsImpl,
} from "./spend-methods.js";
import {
  getApiKeyStatsImpl,
  getCostEfficiencyImpl,
  getDailyTokenTrendImpl,
  getModelDistributionImpl,
  getModelStatisticsImpl,
} from "./stats-methods.js";
import { toNullableNumber } from "./utils.js";

export { toNullableNumber };

export class DatabaseDataSource implements AnalyticsDataSource {
  getMetricsSummary = getMetricsSummaryImpl;
  getDailySpendTrend = getDailySpendTrendImpl;
  getSpendByModel = getSpendByModelImpl;
  getSpendByUser = getSpendByUserImpl;
  getSpendByKey = getSpendByKeyImpl;
  getSpendLogsCount = getSpendLogsCountImpl;
  getSpendLogs = (filters: SpendLogsFilters) =>
    getSpendLogsImpl(filters, this.getSpendLogsCount);
  getTokenDistribution = getTokenDistributionImpl;
  getPerformanceMetrics = getPerformanceMetricsImpl;
  getHourlyUsagePatterns = getHourlyUsagePatternsImpl;
  getApiKeyStats = getApiKeyStatsImpl;
  getCostEfficiency = getCostEfficiencyImpl;
  getModelDistribution = getModelDistributionImpl;
  getDailyTokenTrend = getDailyTokenTrendImpl;
  getModelStatistics = getModelStatisticsImpl;
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
  getAgentConfigs = getAgentConfigsImpl;
  getCategoryConfigs = getCategoryConfigsImpl;
  updateAgentConfig = updateAgentConfigImpl;
  updateCategoryConfig = updateCategoryConfigImpl;
  deleteAgentConfig = deleteAgentConfigImpl;
  deleteCategoryConfig = deleteCategoryConfigImpl;
}
