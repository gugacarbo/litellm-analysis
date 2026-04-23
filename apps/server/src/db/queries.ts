import { eq, gte, and, asc, desc, sql } from 'drizzle-orm';
import { db } from './client';
import { spendLogs, proxyModelTable, errorLogs } from './schema';

const thirtyDaysAgo = sql`NOW() - INTERVAL '30 days'`;
const sevenDaysAgo = sql`NOW() - INTERVAL '7 days'`;

export async function getSpendByModel() {
	const result = await db
		.select({
			model: spendLogs.model,
			total_spend: sql<number>`SUM(${spendLogs.spend})`.mapWith(Number),
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, thirtyDaysAgo))
		.groupBy(spendLogs.model)
		.orderBy(desc(sql`SUM(${spendLogs.spend})`))
		.limit(20);
	return result;
}

export async function getSpendLogs(params: {
	model?: string;
	user?: string;
	startDate?: string;
	endDate?: string;
	limit?: number;
	offset?: number;
}) {
	const conditions = [];

	if (params.model) {
		conditions.push(eq(spendLogs.model, params.model));
	}
	if (params.user) {
		conditions.push(eq(spendLogs.user, params.user));
	}
	if (params.startDate) {
		conditions.push(gte(spendLogs.startTime, sql`${params.startDate}::timestamp`));
	}
	if (params.endDate) {
		conditions.push(sql`${spendLogs.startTime} <= ${params.endDate}::timestamp`);
	}

	const limit = params.limit || 50;
	const offset = params.offset || 0;

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const result = await db
		.select({
			request_id: spendLogs.requestId,
			model: spendLogs.model,
			user: spendLogs.user,
			total_tokens: spendLogs.totalTokens,
			prompt_tokens: spendLogs.promptTokens,
			completion_tokens: spendLogs.completionTokens,
			spend: sql`${spendLogs.spend}`.mapWith(Number),
			startTime: spendLogs.startTime,
			endTime: spendLogs.endTime,
			api_key: spendLogs.apiKey,
			status: spendLogs.status,
		})
		.from(spendLogs)
		.where(whereClause)
		.orderBy(desc(spendLogs.startTime))
		.limit(limit)
		.offset(offset);
	return result;
}

export async function getSpendLogsCount(params: {
	model?: string;
	user?: string;
	startDate?: string;
	endDate?: string;
}): Promise<number> {
	const conditions = [];

	if (params.model) {
		conditions.push(eq(spendLogs.model, params.model));
	}
	if (params.user) {
		conditions.push(eq(spendLogs.user, params.user));
	}
	if (params.startDate) {
		conditions.push(gte(spendLogs.startTime, sql`${params.startDate}::timestamp`));
	}
	if (params.endDate) {
		conditions.push(sql`${spendLogs.startTime} <= ${params.endDate}::timestamp`);
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const result = await db
		.select({ count: sql`COUNT(*)`.mapWith(Number) })
		.from(spendLogs)
		.where(whereClause);
	return result[0]?.count || 0;
}

export async function getSpendByUser() {
	const result = await db
		.select({
			user: spendLogs.user,
			total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
			total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, thirtyDaysAgo))
		.groupBy(spendLogs.user)
		.orderBy(desc(sql`SUM(${spendLogs.spend})`))
		.limit(20);
	return result;
}

export async function getSpendByKey() {
	const result = await db
		.select({
			key: spendLogs.apiKey,
			total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
			total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, thirtyDaysAgo))
		.groupBy(spendLogs.apiKey)
		.orderBy(desc(sql`SUM(${spendLogs.spend})`))
		.limit(20);
	return result;
}

export async function getModelDetails() {
	const result = await db
		.select({
			model_name: proxyModelTable.modelName,
			input_cost_per_token: sql`${proxyModelTable.litellmParams}->>'input_cost_per_token'`,
			output_cost_per_token: sql`${proxyModelTable.litellmParams}->>'output_cost_per_token'`,
		})
		.from(proxyModelTable);
	return result;
}

export async function getErrorLogs(limit = 50) {
	const result = await db
		.select({
			id: errorLogs.requestId,
			error_type: errorLogs.exceptionType,
			model: errorLogs.litellmModelName,
			user: sql`${errorLogs.requestKwargs}->>'user'`,
			error_message: sql`COALESCE(${errorLogs.exceptionString}, 'Unknown error')`,
			timestamp: errorLogs.startTime,
			status_code: errorLogs.statusCode,
		})
		.from(errorLogs)
		.orderBy(desc(errorLogs.startTime))
		.limit(limit);
	return result;
}

export async function getMetricsSummary() {
	const [spend, users, errors, models] = await Promise.all([
		getSpendByModel(),
		getSpendByUser(),
		getErrorLogs(0),
		db
			.select({ count: sql<number>`COUNT(DISTINCT ${spendLogs.model})` })
			.from(spendLogs)
			.where(gte(spendLogs.startTime, thirtyDaysAgo)),
	]);

	const totalSpend = spend.reduce((sum, m) => sum + Number(m.total_spend), 0);
	const totalTokens = users.reduce((sum, u) => sum + Number(u.total_tokens || 0), 0);

	return {
		totalSpend,
		totalTokens,
		activeModels: models[0]?.count || 0,
		errorCount: errors.length,
	};
}

export async function getDailySpendTrend(days = 30) {
	const daysNum = typeof days === 'string' ? parseInt(days, 10) : days;
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - daysNum);
	const result = await db
		.select({
			date: sql`DATE(${spendLogs.startTime})`,
			spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, startDate))
		.groupBy(sql`DATE(${spendLogs.startTime})`)
		.orderBy(asc(sql`DATE(${spendLogs.startTime})`));
	return result;
}

export async function getTokenDistribution() {
	const result = await db
		.select({
			model: spendLogs.model,
			prompt_tokens: sql`SUM(${spendLogs.promptTokens})`.mapWith(Number),
			completion_tokens: sql`SUM(${spendLogs.completionTokens})`.mapWith(Number),
			avg_tokens_per_request: sql`AVG(${spendLogs.totalTokens})`.mapWith(Number),
			input_output_ratio: sql`CASE WHEN SUM(${spendLogs.completionTokens}) > 0 THEN SUM(${spendLogs.promptTokens})::float / SUM(${spendLogs.completionTokens}) ELSE 0 END`,
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, thirtyDaysAgo))
		.groupBy(spendLogs.model)
		.orderBy(desc(sql`SUM(${spendLogs.promptTokens}) + SUM(${spendLogs.completionTokens})`))
		.limit(20);
	return result;
}

export async function getPerformanceMetrics() {
	const result = await db
		.select({
			total_requests: sql`COUNT(*)`.mapWith(Number),
			avg_duration_ms: sql`AVG(EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(Number),
			success_rate: sql`SUM(CASE WHEN ${spendLogs.status} = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100`,
		})
		.from(spendLogs)
		.where(sql`${spendLogs.startTime} >= NOW() - INTERVAL '30 days' AND ${spendLogs.endTime} IS NOT NULL`);
	return result[0] || { total_requests: 0, avg_duration_ms: 0, success_rate: 0 };
}

export async function getHourlyUsagePatterns() {
	const result = await db
		.select({
			hour: sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`,
			request_count: sql`COUNT(*)`.mapWith(Number),
			total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
			total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, sevenDaysAgo))
		.groupBy(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`)
		.orderBy(asc(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`));
	return result;
}

export async function getApiKeyDetailedStats() {
	const result = await db
		.select({
			key: spendLogs.apiKey,
			request_count: sql`COUNT(*)`.mapWith(Number),
			total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
			total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
			avg_tokens_per_request: sql`AVG(${spendLogs.totalTokens})`.mapWith(Number),
			success_rate: sql`SUM(CASE WHEN ${spendLogs.status} = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100`,
			last_used: sql`MAX(${spendLogs.startTime})`,
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, thirtyDaysAgo))
		.groupBy(spendLogs.apiKey)
		.orderBy(desc(sql`SUM(${spendLogs.spend})`))
		.limit(20);
	return result;
}

export async function getCostEfficiencyByModel() {
	const result = await db
		.select({
			model: spendLogs.model,
			total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
			total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
			cost_per_1k_tokens: sql`CASE WHEN SUM(${spendLogs.totalTokens}) > 0 THEN SUM(${spendLogs.spend}) / SUM(${spendLogs.totalTokens}) * 1000 ELSE 0 END`,
			request_count: sql`COUNT(*)`.mapWith(Number),
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, thirtyDaysAgo))
		.groupBy(spendLogs.model)
		.orderBy(desc(sql`SUM(${spendLogs.spend})`))
		.limit(20);
	return result;
}

export async function getModelRequestDistribution() {
	const totalResult = await db
		.select({ count: sql`COUNT(*)`.mapWith(Number) })
		.from(spendLogs)
		.where(sql`${spendLogs.startTime} >= NOW() - INTERVAL '30 days'`);
	const totalCount = totalResult[0]?.count || 1;

	const result = await db
		.select({
			model: spendLogs.model,
			request_count: sql`COUNT(*)`.mapWith(Number),
			percentage: sql`(COUNT(*) * 100.0 / ${totalCount})::numeric(10,2)`,
		})
		.from(spendLogs)
		.where(sql`${spendLogs.startTime} >= NOW() - INTERVAL '30 days'`)
		.groupBy(spendLogs.model)
		.orderBy(desc(sql`COUNT(*)`))
		.limit(15);
	return result;
}

export async function getDailyTokenTrend(days = 30) {
	const daysNum = typeof days === 'string' ? parseInt(days, 10) : days;
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - daysNum);
	const result = await db
		.select({
			date: sql`DATE(${spendLogs.startTime})`,
			prompt_tokens: sql`SUM(${spendLogs.promptTokens})`.mapWith(Number),
			completion_tokens: sql`SUM(${spendLogs.completionTokens})`.mapWith(Number),
			total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, startDate))
		.groupBy(sql`DATE(${spendLogs.startTime})`)
		.orderBy(asc(sql`DATE(${spendLogs.startTime})`));
	return result;
}

export async function getTopModelsByRequests(limit = 10) {
	const result = await db
		.select({
			model: spendLogs.model,
			request_count: sql`COUNT(*)`.mapWith(Number),
		})
		.from(spendLogs)
		.where(gte(spendLogs.startTime, thirtyDaysAgo))
		.groupBy(spendLogs.model)
		.orderBy(desc(sql`COUNT(*)`))
		.limit(limit);
	return result;
}

export async function getModelStatistics() {
	const result = await db
		.select({
			model: spendLogs.model,
			request_count: sql`COUNT(*)`.mapWith(Number),
			total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
			total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
			prompt_tokens: sql`SUM(${spendLogs.promptTokens})`.mapWith(Number),
			completion_tokens: sql`SUM(${spendLogs.completionTokens})`.mapWith(Number),
			avg_tokens_per_request: sql`AVG(${spendLogs.totalTokens})`.mapWith(Number),
			avg_latency_ms: sql`AVG(EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(Number),
			success_rate: sql`SUM(CASE WHEN ${spendLogs.status} = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100`,
			error_count: sql`SUM(CASE WHEN ${spendLogs.status} != 'success' THEN 1 ELSE 0 END)`,
			avg_input_cost: sql`AVG(CASE WHEN ${spendLogs.promptTokens} > 0 THEN ${spendLogs.spend} * ${spendLogs.promptTokens}::float / NULLIF(${spendLogs.totalTokens}, 0) ELSE 0 END)`,
			avg_output_cost: sql`AVG(CASE WHEN ${spendLogs.completionTokens} > 0 THEN ${spendLogs.spend} * ${spendLogs.completionTokens}::float / NULLIF(${spendLogs.totalTokens}, 0) ELSE 0 END)`,
			p50_latency_ms: sql`PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(Number),
			p95_latency_ms: sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(Number),
			p99_latency_ms: sql`PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(Number),
			first_seen: sql`MIN(${spendLogs.startTime})`,
			last_seen: sql`MAX(${spendLogs.startTime})`,
			unique_users: sql`COUNT(DISTINCT ${spendLogs.user})`.mapWith(Number),
			unique_api_keys: sql`COUNT(DISTINCT ${spendLogs.apiKey})`.mapWith(Number),
		})
		.from(spendLogs)
		.where(sql`${spendLogs.startTime} >= NOW() - INTERVAL '30 days' AND ${spendLogs.endTime} IS NOT NULL`)
		.groupBy(spendLogs.model)
		.orderBy(desc(sql`SUM(${spendLogs.spend})`))
		.limit(50);
	return result;
}

export async function getAllModels() {
	const result = await db
		.select({
			modelName: proxyModelTable.modelName,
			litellmParams: proxyModelTable.litellmParams,
		})
		.from(proxyModelTable)
		.orderBy(asc(proxyModelTable.modelName));
	return result;
}

export async function getModelByName(modelName: string) {
	const result = await db
		.select({
			modelName: proxyModelTable.modelName,
			litellmParams: proxyModelTable.litellmParams,
		})
		.from(proxyModelTable)
		.where(eq(proxyModelTable.modelName, modelName))
		.limit(1);
	return result[0] || null;
}

export async function createModel(model: { modelName: string; litellmParams: Record<string, unknown> }) {
	await db.insert(proxyModelTable).values({
		modelName: model.modelName,
		litellmParams: model.litellmParams,
	});
}

export async function updateModel(
	modelName: string,
	updates: { litellmParams?: Record<string, unknown> }
) {
	await db
		.update(proxyModelTable)
		.set(updates)
		.where(eq(proxyModelTable.modelName, modelName));
}

export async function deleteModel(modelName: string) {
	await db
		.delete(proxyModelTable)
		.where(eq(proxyModelTable.modelName, modelName));
}

export async function mergeModels(sourceModel: string, targetModel: string) {
	await db
		.update(spendLogs)
		.set({ model: targetModel })
		.where(eq(spendLogs.model, sourceModel));
}

export async function deleteModelLogs(modelName: string) {
	await db.delete(spendLogs).where(eq(spendLogs.model, modelName));
}

