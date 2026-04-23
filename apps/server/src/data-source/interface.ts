import type {
	AnalyticsCapabilities,
	MetricsSummary,
	DailySpendTrend,
	SpendByModel,
	SpendByUser,
	SpendByKey,
	SpendLogsFilters,
	SpendLogsResponse,
	TokenDistribution,
	PerformanceMetrics,
	HourlyUsagePattern,
	ApiKeyStats,
	CostEfficiency,
	ModelRequestDistribution,
	DailyTokenTrend,
	ModelStatistics,
	ModelEntry,
	ErrorLogEntry,
	ModelDetail,
} from "./types";

export interface AnalyticsDataSource {
	capabilities: AnalyticsCapabilities;

	getMetricsSummary(): Promise<MetricsSummary>;
	getDailySpendTrend(days: number): Promise<DailySpendTrend[]>;
	getSpendByModel(): Promise<SpendByModel[]>;
	getSpendByUser(): Promise<SpendByUser[]>;
	getSpendByKey(): Promise<SpendByKey[]>;
	getSpendLogs(filters: SpendLogsFilters): Promise<SpendLogsResponse>;
	getSpendLogsCount(filters: SpendLogsFilters): Promise<number>;
	getTokenDistribution(): Promise<TokenDistribution[]>;
	getPerformanceMetrics(): Promise<PerformanceMetrics>;
	getHourlyUsagePatterns(): Promise<HourlyUsagePattern[]>;
	getApiKeyStats(): Promise<ApiKeyStats[]>;
	getCostEfficiency(): Promise<CostEfficiency[]>;
	getModelDistribution(): Promise<ModelRequestDistribution[]>;
	getDailyTokenTrend(days: number): Promise<DailyTokenTrend[]>;
	getModelStatistics(): Promise<ModelStatistics[]>;
	getModels(): Promise<ModelEntry[]>;
	getModelDetails(): Promise<ModelDetail[]>;
	getErrorLogs(limit: number): Promise<ErrorLogEntry[]>;
	createModel(model: { modelName: string; litellmParams: Record<string, unknown> }): Promise<void>;
	updateModel(modelName: string, updates: { litellmParams?: Record<string, unknown>; modelName?: string }): Promise<void>;
	deleteModel(modelName: string): Promise<void>;
	mergeModels(sourceModel: string, targetModel: string): Promise<void>;
	deleteModelLogs(modelName: string): Promise<void>;
}
