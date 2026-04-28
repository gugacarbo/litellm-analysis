import { desc, sql } from 'drizzle-orm';
import { db, schema } from './client';
import { getSpendLogsTimeCondition, normalizeDays } from './helpers';

const { spendLogs } = schema;

export async function getTokenDistribution(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      model: spendLogs.model,
      prompt_tokens: sql`SUM(${spendLogs.promptTokens})`.mapWith(Number),
      completion_tokens: sql`SUM(${spendLogs.completionTokens})`.mapWith(
        Number,
      ),
      avg_tokens_per_request: sql`AVG(${spendLogs.totalTokens})`.mapWith(
        Number,
      ),
      input_output_ratio: sql`CASE WHEN SUM(${spendLogs.completionTokens}) > 0 THEN SUM(${spendLogs.promptTokens})::float / SUM(${spendLogs.completionTokens}) ELSE 0 END`,
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(
      desc(
        sql`SUM(${spendLogs.promptTokens}) + SUM(${spendLogs.completionTokens})`,
      ),
    )
    .limit(20);
  return result;
}

export async function getApiKeyDetailedStats(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      key: spendLogs.apiKey,
      request_count: sql`COUNT(*)`.mapWith(Number),
      total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      avg_tokens_per_request: sql`AVG(${spendLogs.totalTokens})`.mapWith(
        Number,
      ),
      success_rate: sql`SUM(CASE WHEN ${spendLogs.status} = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100`,
      last_used: sql`MAX(${spendLogs.startTime})`,
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.apiKey)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
}

export async function getModelRequestDistribution(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const totalResult = await db
    .select({ count: sql`COUNT(*)`.mapWith(Number) })
    .from(spendLogs)
    .where(whereClause);
  const totalCount = totalResult[0]?.count || 1;

  const result = await db
    .select({
      model: spendLogs.model,
      request_count: sql<number>`COUNT(*)`.mapWith(Number),
      percentage: sql`(COUNT(*) * 100.0 / ${totalCount})::numeric(10,2)`,
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(15);
  return result;
}

export async function getTopModelsByRequests(limit = 10, days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      model: spendLogs.model,
      request_count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);
  return result;
}
