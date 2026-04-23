import type { AnalyticsDataSource } from './interface';
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
} from './types';
import {
	getMetricsSummary,
	getDailySpendTrend,
	getSpendByModel,
	getSpendByUser,
	getSpendByKey,
	getSpendLogs,
	getSpendLogsCount,
	getTokenDistribution,
	getPerformanceMetrics,
	getHourlyUsagePatterns,
	getApiKeyDetailedStats,
	getCostEfficiencyByModel,
	getModelRequestDistribution,
	getDailyTokenTrend,
	getModelStatistics,
	getAllModels,
	getModelDetails,
	getErrorLogs,
	createModel as createModelQuery,
	updateModel as updateModelQuery,
	deleteModel as deleteModelQuery,
	mergeModels as mergeModelsQuery,
	deleteModelLogs as deleteModelLogsQuery,
} from '../db/queries';

export const DATABASE_CAPABILITIES: AnalyticsCapabilities = {
	spendByModel: true,
	spendByUser: true,
	spendByKey: true,
	spendLogs: true,
	metricsSummary: true,
	dailySpendTrend: true,
	tokenDistribution: true,
	performanceMetrics: true,
	hourlyUsagePatterns: true,
	apiKeyStats: true,
	costEfficiency: true,
	modelDistribution: true,
	dailyTokenTrend: true,
	modelStatistics: true,
	models: true,
	errorLogs: true,
	detailedLatency: true,
	logMerge: true,
	filterOptions: true,
	createModel: true,
	updateModel: true,
	deleteModel: true,
	mergeModels: true,
	deleteModelLogs: true,
};

export const LIMITED_CAPABILITIES: AnalyticsCapabilities = {
	spendByModel: true,
	spendByUser: true,
	spendByKey: true,
	spendLogs: true,
	metricsSummary: true,
	dailySpendTrend: true,
	tokenDistribution: true,
	performanceMetrics: true,
	hourlyUsagePatterns: true,
	apiKeyStats: true,
	costEfficiency: true,
	modelDistribution: true,
	dailyTokenTrend: true,
	modelStatistics: true,
	models: true,
	errorLogs: true,
	detailedLatency: true,
	logMerge: true,
	filterOptions: true,
	createModel: false,
	updateModel: true,
	deleteModel: false,
	mergeModels: false,
	deleteModelLogs: false,
};

export class DatabaseDataSource implements AnalyticsDataSource {
	capabilities: AnalyticsCapabilities;

	constructor(capabilities: AnalyticsCapabilities = DATABASE_CAPABILITIES) {
		this.capabilities = capabilities;
	}

	async getMetricsSummary(): Promise<MetricsSummary> {
		const result = await getMetricsSummary();
		return {
			total_spend: result.totalSpend,
			total_tokens: result.totalTokens,
			active_models: result.activeModels,
			error_count: result.errorCount,
		};
	}

	async getDailySpendTrend(days: number): Promise<DailySpendTrend[]> {
		const result = await getDailySpendTrend(days);
		return result.map((item) => ({
			date: String(item.date),
			spend: item.spend,
		}));
	}

	async getSpendByModel(): Promise<SpendByModel[]> {
		const result = await getSpendByModel();
		return result.map((item) => ({
			model: item.model,
			total_spend: Number(item.total_spend),
		}));
	}

	async getSpendByUser(): Promise<SpendByUser[]> {
		const result = await getSpendByUser();
		return result.map((item) => ({
			user: item.user,
			total_spend: Number(item.total_spend),
			total_tokens: Number(item.total_tokens || 0),
		}));
	}

	async getSpendByKey(): Promise<SpendByKey[]> {
		const result = await getSpendByKey();
		return result.map((item) => ({
			key: item.key,
			total_spend: Number(item.total_spend),
			total_tokens: Number(item.total_tokens || 0),
		}));
	}

	async getSpendLogsCount(filters: SpendLogsFilters): Promise<number> {
		return getSpendLogsCount({
			model: filters.model,
			user: filters.user,
			startDate: filters.startDate,
			endDate: filters.endDate,
		});
	}

	async getSpendLogs(filters: SpendLogsFilters): Promise<SpendLogsResponse> {
		const limit = filters.limit ?? 50;
		const offset = filters.offset ?? 0;

		const [result, total] = await Promise.all([
			getSpendLogs({
				model: filters.model,
				user: filters.user,
				startDate: filters.startDate,
				endDate: filters.endDate,
				limit,
				offset,
			}),
			this.getSpendLogsCount(filters),
		]);

		const logs = result.map((item) => ({
			request_id: item.request_id,
			model: item.model,
			user: item.user,
			total_tokens: item.total_tokens,
			prompt_tokens: item.prompt_tokens,
			completion_tokens: item.completion_tokens,
			spend: Number(item.spend),
			start_time: item.startTime ? new Date(item.startTime).toISOString() : '',
			end_time: item.endTime ? new Date(item.endTime).toISOString() : null,
			api_key: item.api_key,
			status: item.status,
		}));

		return {
			logs,
			pagination: {
				total,
				page: Math.floor(offset / limit) + 1,
				page_size: limit,
				total_pages: total === 0 ? 0 : Math.ceil(total / limit),
			},
		};
	}

	async getTokenDistribution(): Promise<TokenDistribution[]> {
		const result = await getTokenDistribution();
		return result.map((item) => ({
			model: item.model,
			prompt_tokens: Number(item.prompt_tokens),
			completion_tokens: Number(item.completion_tokens),
			avg_tokens_per_request: Number(item.avg_tokens_per_request),
			input_output_ratio: Number(item.input_output_ratio),
		}));
	}

	async getPerformanceMetrics(): Promise<PerformanceMetrics> {
		const result = await getPerformanceMetrics();
		return {
			total_requests: Number(result.total_requests),
			avg_duration_ms: Number(result.avg_duration_ms || 0),
			success_rate: Number(result.success_rate || 0),
		};
	}

	async getHourlyUsagePatterns(): Promise<HourlyUsagePattern[]> {
		const result = await getHourlyUsagePatterns();
		return result.map((item) => ({
			hour: Number(item.hour),
			request_count: Number(item.request_count),
			total_spend: Number(item.total_spend),
			total_tokens: Number(item.total_tokens),
		}));
	}

	async getApiKeyStats(): Promise<ApiKeyStats[]> {
		const result = await getApiKeyDetailedStats();
		return result.map((item) => ({
			key: item.key,
			request_count: Number(item.request_count),
			total_spend: Number(item.total_spend),
			total_tokens: Number(item.total_tokens),
			avg_tokens_per_request: Number(item.avg_tokens_per_request),
			success_rate: Number(item.success_rate || 0),
			last_used: item.last_used ? new Date(item.last_used as Date).toISOString() : '',
		}));
	}

	async getCostEfficiency(): Promise<CostEfficiency[]> {
		const result = await getCostEfficiencyByModel();
		return result.map((item) => ({
			model: item.model,
			total_spend: Number(item.total_spend),
			total_tokens: Number(item.total_tokens),
			cost_per_1k_tokens: Number(item.cost_per_1k_tokens),
			request_count: Number(item.request_count),
		}));
	}

	async getModelDistribution(): Promise<ModelRequestDistribution[]> {
		const result = await getModelRequestDistribution();
		return result.map((item) => ({
			model: item.model,
			request_count: Number(item.request_count),
			percentage: Number(item.percentage),
		}));
	}

	async getDailyTokenTrend(days: number): Promise<DailyTokenTrend[]> {
		const result = await getDailyTokenTrend(days);
		return result.map((item) => ({
			date: String(item.date),
			prompt_tokens: Number(item.prompt_tokens),
			completion_tokens: Number(item.completion_tokens),
			total_tokens: Number(item.total_tokens),
		}));
	}

	async getModelStatistics(): Promise<ModelStatistics[]> {
		const result = await getModelStatistics();
		return result.map((item) => ({
			model: item.model,
			request_count: Number(item.request_count),
			total_spend: Number(item.total_spend),
			total_tokens: Number(item.total_tokens),
			prompt_tokens: Number(item.prompt_tokens),
			completion_tokens: Number(item.completion_tokens),
			avg_tokens_per_request: Number(item.avg_tokens_per_request),
			avg_latency_ms: Number(item.avg_latency_ms || 0),
			success_rate: Number(item.success_rate || 0),
			error_count: Number(item.error_count || 0),
			avg_input_cost: Number(item.avg_input_cost || 0),
			avg_output_cost: Number(item.avg_output_cost || 0),
			p50_latency_ms: Number(item.p50_latency_ms || 0),
			p95_latency_ms: Number(item.p95_latency_ms || 0),
			p99_latency_ms: Number(item.p99_latency_ms || 0),
			first_seen: item.first_seen ? new Date(item.first_seen as Date).toISOString() : '',
			last_seen: item.last_seen ? new Date(item.last_seen as Date).toISOString() : '',
			unique_users: Number(item.unique_users || 0),
			unique_api_keys: Number(item.unique_api_keys || 0),
		}));
	}

	async getModels(): Promise<ModelEntry[]> {
		const result = await getAllModels();
		return result.map((item) => ({
			modelName: item.modelName,
			litellmParams: item.litellmParams as Record<string, unknown> | null,
		}));
	}

	async getModelDetails(): Promise<ModelDetail[]> {
		const result = await getModelDetails();
		return result.map((item) => ({
			model_name: item.model_name,
			input_cost_per_token: item.input_cost_per_token as string | null,
			output_cost_per_token: item.output_cost_per_token as string | null,
		}));
	}

	async getErrorLogs(limit: number): Promise<ErrorLogEntry[]> {
		const result = await getErrorLogs(limit);
		return result.map((item) => ({
			id: item.id,
			error_type: item.error_type || '',
			model: item.model || '',
			user: String(item.user ?? ''),
			error_message: String(item.error_message ?? ''),
			timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : '',
			status_code: item.status_code || 0,
		}));
	}

	async createModel(model: { modelName: string; litellmParams: Record<string, unknown> }): Promise<void> {
		await createModelQuery(model);
	}

	async updateModel(
		modelName: string,
		updates: { litellmParams?: Record<string, unknown>; modelName?: string }
	): Promise<void> {
		await updateModelQuery(modelName, updates);
	}

	async deleteModel(modelName: string): Promise<void> {
		await deleteModelQuery(modelName);
	}

	async mergeModels(sourceModel: string, targetModel: string): Promise<void> {
		await mergeModelsQuery(sourceModel, targetModel);
	}

	async deleteModelLogs(modelName: string): Promise<void> {
		await deleteModelLogsQuery(modelName);
	}
}
