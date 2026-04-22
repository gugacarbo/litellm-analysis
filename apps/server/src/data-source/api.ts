import type {
	AnalyticsDataSource,
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
} from './types';

const API_CAPABILITIES: AnalyticsCapabilities = {
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
	errorLogs: false,
	detailedLatency: false,
	logMerge: false,
	filterOptions: false,
};

interface LiteLLMResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export class ApiDataSource implements AnalyticsDataSource {
	private apiUrl: string;
	private apiKey: string;
	capabilities = API_CAPABILITIES;

	constructor(apiUrl: string, apiKey: string) {
		this.apiUrl = apiUrl.replace(/\/$/, '');
		this.apiKey = apiKey;
	}

	private async fetchWithAuth<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		const url = `${this.apiUrl}${endpoint}`;
		const response = await fetch(url, {
			...options,
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
				...options.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}

		return response.json() as Promise<T>;
	}

	async getMetricsSummary(): Promise<MetricsSummary> {
		const dailyMetrics = await this.fetchWithAuth<DailyMetricsResponse[]>('/daily_metrics');

		if (!dailyMetrics || !Array.isArray(dailyMetrics) || dailyMetrics.length === 0) {
			return {
				total_spend: 0,
				total_tokens: 0,
				active_models: 0,
				error_count: 0,
			};
		}

		const total_spend = dailyMetrics.reduce((sum, day) => sum + (day.daily_spend || 0), 0);

		const modelSet = new Set<string>();
		dailyMetrics.forEach(day => {
			if (day.spend_per_model) {
				Object.keys(day.spend_per_model).forEach(model => modelSet.add(model));
			}
		});

		return {
			total_spend,
			total_tokens: 0,
			active_models: modelSet.size,
			error_count: 0,
		};
	}

	async getDailySpendTrend(days: number): Promise<DailySpendTrend[]> {
		const dailyMetrics = await this.fetchWithAuth<DailyMetricsResponse[]>('/daily_metrics');

		if (!dailyMetrics || !Array.isArray(dailyMetrics)) {
			return [];
		}

		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);

		return dailyMetrics
			.filter(day => new Date(day.day) >= cutoff)
			.map(day => ({
				date: day.day.split('T')[0],
				spend: day.daily_spend || 0,
			}))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	}

	async getSpendByModel(): Promise<SpendByModel[]> {
		const report = await this.fetchWithAuth<GlobalSpendReport[]>('/global/spend/report?group_by=model');

		if (!report || !Array.isArray(report)) {
			return [];
		}

		const modelMap = new Map<string, number>();
		report.forEach(item => {
			if (item.model_details) {
				item.model_details.forEach((detail: { model: string; total_cost: number }) => {
					const current = modelMap.get(detail.model) || 0;
					modelMap.set(detail.model, current + (detail.total_cost || 0));
				});
			} else if (item.metadata) {
				item.metadata.forEach((detail: { model: string; spend: number }) => {
					const current = modelMap.get(detail.model) || 0;
					modelMap.set(detail.model, current + (detail.spend || 0));
				});
			}
		});

		return Array.from(modelMap.entries()).map(([model, total_spend]) => ({
			model,
			total_spend,
		}));
	}

	async getSpendByUser(): Promise<SpendByUser[]> {
		const report = await this.fetchWithAuth<GlobalSpendReport[]>('/global/spend/report?group_by=user');

		if (!report || !Array.isArray(report)) {
			return [];
		}

		return report.map(item => ({
			user: item.user_id || null,
			total_spend: Number(item.total_cost || item.total_spend || 0),
			total_tokens: Number(item.total_input_tokens || 0) + Number(item.total_output_tokens || 0),
		}));
	}

	async getSpendByKey(): Promise<SpendByKey[]> {
		const report = await this.fetchWithAuth<GlobalSpendReport[]>('/global/spend/report?group_by=api_key');

		if (!report || !Array.isArray(report)) {
			return [];
		}

		return report.map(item => ({
			key: item.api_key || null,
			total_spend: Number(item.total_cost || item.total_spend || 0),
			total_tokens: Number(item.total_input_tokens || 0) + Number(item.total_output_tokens || 0),
		}));
	}

	async getSpendLogs(filters: SpendLogsFilters): Promise<SpendLogEntry[]> {
		const params = new URLSearchParams();
		if (filters.model) params.append('model', filters.model);
		if (filters.user) params.append('user', filters.user);
		if (filters.startDate) params.append('start_date', filters.startDate);
		if (filters.endDate) params.append('end_date', filters.endDate);
		if (filters.limit) params.append('limit', String(filters.limit));
		if (filters.offset) params.append('offset', String(filters.offset));

		const logs = await this.fetchWithAuth<SpendLogResponse[]>(`/spend/logs?${params.toString()}`);

		if (!logs || !Array.isArray(logs)) {
			return [];
		}

		return logs.map(log => ({
			request_id: log.request_id,
			model: log.model,
			user: log.user || null,
			total_tokens: log.total_tokens !== null ? Number(log.total_tokens) : null,
			prompt_tokens: log.prompt_tokens !== null ? Number(log.prompt_tokens) : null,
			completion_tokens: log.completion_tokens !== null ? Number(log.completion_tokens) : null,
			spend: Number(log.spend || log.total_spend || 0),
			start_time: log.startTime ? new Date(log.startTime).toISOString() : '',
			end_time: log.endTime ? new Date(log.endTime).toISOString() : null,
			api_key: log.api_key || null,
			status: log.status || 'unknown',
		}));
	}

	async getTokenDistribution(): Promise<TokenDistribution[]> {
		const logs = await this.fetchWithAuth<SpendLogResponse[]>('/spend/logs?limit=1000');

		if (!logs || !Array.isArray(logs)) {
			return [];
		}

		const modelData = new Map<string, { prompt: number; completion: number; count: number }>();

		logs.forEach(log => {
			const model = log.model;
			if (!modelData.has(model)) {
				modelData.set(model, { prompt: 0, completion: 0, count: 0 });
			}
			const data = modelData.get(model)!;
			data.prompt += Number(log.prompt_tokens || 0);
			data.completion += Number(log.completion_tokens || 0);
			data.count += 1;
		});

		return Array.from(modelData.entries()).map(([model, data]) => {
			const total = data.prompt + data.completion;
			return {
				model,
				prompt_tokens: data.prompt,
				completion_tokens: data.completion,
				avg_tokens_per_request: data.count > 0 ? total / data.count : 0,
				input_output_ratio: data.completion > 0 ? data.prompt / data.completion : 0,
			};
		});
	}

	async getPerformanceMetrics(): Promise<PerformanceMetrics> {
		const logs = await this.fetchWithAuth<SpendLogResponse[]>('/spend/logs?limit=1000');

		if (!logs || !Array.isArray(logs) || logs.length === 0) {
			return {
				total_requests: 0,
				avg_duration_ms: 0,
				success_rate: 0,
			};
		}

		const total_requests = logs.length;
		const successful = logs.filter(log => log.status === 'success').length;

		let totalDuration = 0;
		let count = 0;
		logs.forEach(log => {
			if (log.startTime && log.endTime) {
				const start = new Date(log.startTime).getTime();
				const end = new Date(log.endTime).getTime();
				if (end > start) {
					totalDuration += (end - start);
					count++;
				}
			}
		});

		return {
			total_requests,
			avg_duration_ms: count > 0 ? totalDuration / count : 0,
			success_rate: total_requests > 0 ? successful / total_requests : 0,
		};
	}

	async getHourlyUsagePatterns(): Promise<HourlyUsagePattern[]> {
		const logs = await this.fetchWithAuth<SpendLogResponse[]>('/spend/logs?limit=1000');

		if (!logs || !Array.isArray(logs)) {
			return [];
		}

		const hourlyData = new Map<number, { count: number; spend: number; tokens: number }>();

		for (let i = 0; i < 24; i++) {
			hourlyData.set(i, { count: 0, spend: 0, tokens: 0 });
		}

		logs.forEach(log => {
			if (log.startTime) {
				const hour = new Date(log.startTime).getHours();
				const data = hourlyData.get(hour)!;
				data.count++;
				data.spend += Number(log.spend || 0);
				data.tokens += Number(log.total_tokens || 0);
			}
		});

		return Array.from(hourlyData.entries()).map(([hour, data]) => ({
			hour,
			request_count: data.count,
			total_spend: data.spend,
			total_tokens: data.tokens,
		}));
	}

	async getApiKeyStats(): Promise<ApiKeyStats[]> {
		const report = await this.fetchWithAuth<GlobalSpendReport[]>('/global/spend/report?group_by=api_key');

		if (!report || !Array.isArray(report)) {
			return [];
		}

		return report.map(item => {
			const total_tokens = Number(item.total_input_tokens || 0) + Number(item.total_output_tokens || 0);
			const request_count = item.request_count || item.metadata?.length || 0;
			return {
				key: item.api_key || null,
				request_count: Number(request_count),
				total_spend: Number(item.total_cost || item.total_spend || 0),
				total_tokens,
				avg_tokens_per_request: request_count > 0 ? total_tokens / request_count : 0,
				success_rate: 1,
				last_used: new Date().toISOString(),
			};
		});
	}

	async getCostEfficiency(): Promise<CostEfficiency[]> {
		const logs = await this.fetchWithAuth<SpendLogResponse[]>('/spend/logs?limit=1000');

		if (!logs || !Array.isArray(logs)) {
			return [];
		}

		const modelData = new Map<string, { spend: number; tokens: number; count: number }>();

		logs.forEach(log => {
			const model = log.model;
			if (!modelData.has(model)) {
				modelData.set(model, { spend: 0, tokens: 0, count: 0 });
			}
			const data = modelData.get(model)!;
			data.spend += Number(log.spend || 0);
			data.tokens += Number(log.total_tokens || 0);
			data.count++;
		});

		return Array.from(modelData.entries()).map(([model, data]) => ({
			model,
			total_spend: data.spend,
			total_tokens: data.tokens,
			cost_per_1k_tokens: data.tokens > 0 ? (data.spend / data.tokens) * 1000 : 0,
			request_count: data.count,
		}));
	}

	async getModelDistribution(): Promise<ModelRequestDistribution[]> {
		const logs = await this.fetchWithAuth<SpendLogResponse[]>('/spend/logs?limit=1000');

		if (!logs || !Array.isArray(logs) || logs.length === 0) {
			return [];
		}

		const modelCounts = new Map<string, number>();
		logs.forEach(log => {
			const count = modelCounts.get(log.model) || 0;
			modelCounts.set(log.model, count + 1);
		});

		const total = logs.length;
		return Array.from(modelCounts.entries()).map(([model, count]) => ({
			model,
			request_count: count,
			percentage: total > 0 ? (count / total) * 100 : 0,
		}));
	}

	async getDailyTokenTrend(days: number): Promise<DailyTokenTrend[]> {
		const logs = await this.fetchWithAuth<SpendLogResponse[]>('/spend/logs?limit=1000');

		if (!logs || !Array.isArray(logs)) {
			return [];
		}

		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);

		const dailyData = new Map<string, { prompt: number; completion: number }>();

		logs
			.filter((log): log is typeof log & { startTime: string } => Boolean(log.startTime))
			.filter(log => new Date(log.startTime) >= cutoff)
			.forEach(log => {
				const date = log.startTime.split('T')[0];
				if (!dailyData.has(date)) {
					dailyData.set(date, { prompt: 0, completion: 0 });
				}
				const data = dailyData.get(date)!;
				data.prompt += Number(log.prompt_tokens || 0);
				data.completion += Number(log.completion_tokens || 0);
			});

		return Array.from(dailyData.entries())
			.map(([date, data]) => ({
				date,
				prompt_tokens: data.prompt,
				completion_tokens: data.completion,
				total_tokens: data.prompt + data.completion,
			}))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	}

	async getModelStatistics(): Promise<ModelStatistics[]> {
		const logs = await this.fetchWithAuth<SpendLogResponse[]>('/spend/logs?limit=1000');

		if (!logs || !Array.isArray(logs)) {
			return [];
		}

		const modelData = new Map<string, {
			spend: number;
			prompt: number;
			completion: number;
			count: number;
			latencies: number[];
			successes: number;
			errors: number;
			userSet: Set<string>;
			keySet: Set<string>;
			times: number[];
		}>();

		logs.forEach(log => {
			const model = log.model;
			if (!modelData.has(model)) {
				modelData.set(model, {
					spend: 0,
					prompt: 0,
					completion: 0,
					count: 0,
					latencies: [],
					successes: 0,
					errors: 0,
					userSet: new Set(),
					keySet: new Set(),
					times: [],
				});
			}
			const data = modelData.get(model)!;
			data.spend += Number(log.spend || 0);
			data.prompt += Number(log.prompt_tokens || 0);
			data.completion += Number(log.completion_tokens || 0);
			data.count++;

			if (log.user) data.userSet.add(log.user);
			if (log.api_key) data.keySet.add(log.api_key);
			if (log.startTime) data.times.push(new Date(log.startTime).getTime());

			if (log.startTime && log.endTime) {
				const start = new Date(log.startTime).getTime();
				const end = new Date(log.endTime).getTime();
				if (end > start) {
					data.latencies.push(end - start);
				}
			}

			if (log.status === 'success') {
				data.successes++;
			} else {
				data.errors++;
			}
		});

		return Array.from(modelData.entries()).map(([model, data]) => {
			const total_tokens = data.prompt + data.completion;
			const sortedLatencies = [...data.latencies].sort((a, b) => a - b);
			const avgLatency = data.latencies.length > 0
				? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length
				: 0;

			const sortedTimes = [...data.times].sort((a, b) => a - b);

			return {
				model,
				request_count: data.count,
				total_spend: data.spend,
				total_tokens,
				prompt_tokens: data.prompt,
				completion_tokens: data.completion,
				avg_tokens_per_request: data.count > 0 ? total_tokens / data.count : 0,
				avg_latency_ms: avgLatency,
				success_rate: data.count > 0 ? data.successes / data.count : 0,
				error_count: data.errors,
				avg_input_cost: 0,
				avg_output_cost: 0,
				p50_latency_ms: sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0,
				p95_latency_ms: sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0,
				p99_latency_ms: sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0,
				first_seen: sortedTimes[0] ? new Date(sortedTimes[0]).toISOString() : null,
				last_seen: sortedTimes[sortedTimes.length - 1] ? new Date(sortedTimes[sortedTimes.length - 1]).toISOString() : null,
				unique_users: data.userSet.size,
				unique_api_keys: data.keySet.size,
			};
		});
	}

	async getModels(): Promise<ModelEntry[]> {
		const response = await this.fetchWithAuth<ModelsResponse>('/v1/models');

		if (!response || !response.data || !Array.isArray(response.data)) {
			return [];
		}

		return response.data.map((model) => ({
			model_name: model.id,
			litellm_params: null,
		}));
	}

	async getModelDetails(): Promise<ModelDetail[]> {
		return [];
	}

	async getErrorLogs(_limit: number): Promise<ErrorLogEntry[]> {
		return [];
	}
}

interface DailyMetricsResponse {
	daily_spend: number;
	day: string;
	spend_per_model?: Record<string, number>;
	spend_per_api_key?: Record<string, number>;
}

interface GlobalSpendReport {
	api_key?: string;
	total_cost?: number;
	total_spend?: number;
	total_input_tokens?: number;
	total_output_tokens?: number;
	model_details?: Array<{
		model: string;
		total_cost: number;
		total_input_tokens: number;
		total_output_tokens: number;
	}>;
	metadata?: Array<{
		model: string;
		spend: number;
		total_tokens: number;
		api_key: string;
	}>;
	user_id?: string;
	request_count?: number;
}

interface SpendLogResponse {
	request_id: string;
	model: string;
	user?: string | null;
	total_tokens?: number | null;
	prompt_tokens?: number | null;
	completion_tokens?: number | null;
	spend?: number;
	total_spend?: number;
	startTime?: string;
	endTime?: string | null;
	api_key?: string | null;
	status?: string;
}

interface ModelsResponse {
	object: string;
	data: Array<{
		id: string;
		object: string;
		created: number;
		owned_by: string;
	}>;
}
