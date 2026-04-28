import { desc, eq, gte, type SQL, sql } from 'drizzle-orm';
import { db, schema } from './client';
import {
  combineConditions,
  getSpendLogsTimeCondition,
  normalizeDays,
} from './helpers';

const { spendLogs } = schema;

export async function getSpendByModel(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));

  const result = await db
    .select({
      model: spendLogs.model,
      total_spend: sql<number>`SUM(${spendLogs.spend})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
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
  const conditions: SQL[] = [];

  if (params.model) {
    conditions.push(eq(spendLogs.model, params.model));
  }
  if (params.user) {
    conditions.push(eq(spendLogs.user, params.user));
  }
  if (params.startDate) {
    conditions.push(
      gte(spendLogs.startTime, sql`${params.startDate}::timestamp`),
    );
  }
  if (params.endDate) {
    conditions.push(
      sql`${spendLogs.startTime} <= ${params.endDate}::timestamp`,
    );
  }

  const limit = params.limit || 50;
  const offset = params.offset || 0;

  const whereClause = combineConditions(conditions);
  const completionStartTime = sql<string | null>`COALESCE(
    to_jsonb(${spendLogs}) ->> 'completionStartTime',
    to_jsonb(${spendLogs}) ->> 'completion_start_time'
  )`;

  const result = await db
    .select({
      request_id: spendLogs.requestId,
      model: spendLogs.model,
      user: spendLogs.user,
      total_tokens: spendLogs.totalTokens,
      prompt_tokens: spendLogs.promptTokens,
      completion_tokens: spendLogs.completionTokens,
      spend: sql`${spendLogs.spend}`.mapWith(Number),
      time_to_first_token_ms: sql<number | null>`CASE
        WHEN ${completionStartTime} IS NULL THEN NULL
        WHEN ${completionStartTime} !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN NULL
        ELSE
          EXTRACT(
            EPOCH
            FROM ((${completionStartTime})::timestamptz - ${spendLogs.startTime})
          ) * 1000
      END`,
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
  const conditions: SQL[] = [];

  if (params.model) {
    conditions.push(eq(spendLogs.model, params.model));
  }
  if (params.user) {
    conditions.push(eq(spendLogs.user, params.user));
  }
  if (params.startDate) {
    conditions.push(
      gte(spendLogs.startTime, sql`${params.startDate}::timestamp`),
    );
  }
  if (params.endDate) {
    conditions.push(
      sql`${spendLogs.startTime} <= ${params.endDate}::timestamp`,
    );
  }

  const whereClause = combineConditions(conditions);

  const result = await db
    .select({ count: sql`COUNT(*)`.mapWith(Number) })
    .from(spendLogs)
    .where(whereClause);
  return result[0]?.count || 0;
}

export async function getSpendByUser(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));

  const result = await db
    .select({
      user: spendLogs.user,
      total_spend: sql<number>`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql<number>`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      request_count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.user)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
}

export async function getSpendByKey(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));

  const result = await db
    .select({
      key: spendLogs.apiKey,
      total_spend: sql<number>`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql<number>`SUM(${spendLogs.totalTokens})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.apiKey)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
}
