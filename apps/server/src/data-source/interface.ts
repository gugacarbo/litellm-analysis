import type {
	AnalyticsCapabilities,
	MetricsSummary,
	DailySpendTrend,
	SpendByModel,
	SpendByUser,
	SpendByKey,
	SpendLogsFilters,
	SpendLogEntry,
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
	getSpendLogs(filters: SpendLogsFilters): Promise<SpendLogEntry[]>;
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
}
