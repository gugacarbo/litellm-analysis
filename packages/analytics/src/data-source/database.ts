import { toNullableNumber } from './utils.js';
import type {
  AnalyticsDataSource,
  SpendLogsFilters,
} from '../types/index.js';

import {
  getMetricsSummaryImpl,
  getDailySpendTrendImpl,
} from './metrics-methods.js';
import {
  getSpendByModelImpl,
  getSpendByUserImpl,
  getSpendByKeyImpl,
  getSpendLogsCountImpl,
  getSpendLogsImpl,
} from './spend-methods.js';
import {
  getTokenDistributionImpl,
  getPerformanceMetricsImpl,
  getHourlyUsagePatternsImpl,
} from './analytics-methods.js';
import {
  getApiKeyStatsImpl,
  getCostEfficiencyImpl,
  getModelDistributionImpl,
  getDailyTokenTrendImpl,
  getModelStatisticsImpl,
} from './stats-methods.js';
import {
  getModelsImpl,
  getModelDetailsImpl,
  createModelImpl,
  updateModelImpl,
  deleteModelImpl,
  mergeModelsImpl,
  deleteModelLogsImpl,
} from './model-methods.js';
import { getErrorLogsImpl } from './error-methods.js';
import {
  getAgentRoutingConfigImpl,
  updateAgentRoutingConfigImpl,
} from './routing-methods.js';
import {
  getAgentConfigsImpl,
  getCategoryConfigsImpl,
  updateAgentConfigImpl,
  updateCategoryConfigImpl,
  deleteAgentConfigImpl,
  deleteCategoryConfigImpl,
} from './config-methods.js';

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
