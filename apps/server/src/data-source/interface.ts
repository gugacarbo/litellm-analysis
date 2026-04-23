import type {
  AnalyticsCapabilities,
  ApiKeyStats,
  CostEfficiency,
  DailySpendTrend,
  DailyTokenTrend,
  ErrorLogEntry,
  HourlyUsagePattern,
  MetricsSummary,
  ModelDetail,
  ModelEntry,
  ModelRequestDistribution,
  ModelStatistics,
  PerformanceMetrics,
  SpendByKey,
  SpendByModel,
  SpendByUser,
  SpendLogsFilters,
  SpendLogsResponse,
  TokenDistribution,
} from './types';

export interface AnalyticsDataSource {
  capabilities: AnalyticsCapabilities;

  getMetricsSummary(days?: number): Promise<MetricsSummary>;
  getDailySpendTrend(days?: number): Promise<DailySpendTrend[]>;
  getSpendByModel(days?: number): Promise<SpendByModel[]>;
  getSpendByUser(days?: number): Promise<SpendByUser[]>;
  getSpendByKey(days?: number): Promise<SpendByKey[]>;
  getSpendLogs(filters: SpendLogsFilters): Promise<SpendLogsResponse>;
  getSpendLogsCount(filters: SpendLogsFilters): Promise<number>;
  getTokenDistribution(days?: number): Promise<TokenDistribution[]>;
  getPerformanceMetrics(days?: number): Promise<PerformanceMetrics>;
  getHourlyUsagePatterns(days?: number): Promise<HourlyUsagePattern[]>;
  getApiKeyStats(days?: number): Promise<ApiKeyStats[]>;
  getCostEfficiency(days?: number): Promise<CostEfficiency[]>;
  getModelDistribution(days?: number): Promise<ModelRequestDistribution[]>;
  getDailyTokenTrend(days?: number): Promise<DailyTokenTrend[]>;
  getModelStatistics(days?: number): Promise<ModelStatistics[]>;
  getModels(): Promise<ModelEntry[]>;
  getModelDetails(): Promise<ModelDetail[]>;
  getErrorLogs(limit: number, days?: number): Promise<ErrorLogEntry[]>;
  createModel(model: {
    modelName: string;
    litellmParams: Record<string, unknown>;
  }): Promise<void>;
  updateModel(
    modelName: string,
    updates: { litellmParams?: Record<string, unknown>; modelName?: string },
  ): Promise<void>;
  deleteModel(modelName: string): Promise<void>;
  mergeModels(sourceModel: string, targetModel: string): Promise<void>;
  deleteModelLogs(modelName: string): Promise<void>;
  getAgentRoutingConfig(): Promise<Record<string, unknown> | null>;
  updateAgentRoutingConfig(config: Record<string, unknown>): Promise<void>;
  getAgentConfigs(): Promise<Record<string, unknown>>;
  getCategoryConfigs(): Promise<Record<string, unknown>>;
  updateAgentConfig(
    agentKey: string,
    config: Record<string, unknown>,
  ): Promise<void>;
  updateCategoryConfig(
    categoryKey: string,
    config: Record<string, unknown>,
  ): Promise<void>;
  deleteAgentConfig(agentKey: string): Promise<void>;
  deleteCategoryConfig(categoryKey: string): Promise<void>;
}
