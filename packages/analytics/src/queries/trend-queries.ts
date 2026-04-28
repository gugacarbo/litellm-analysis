import { asc, sql } from "drizzle-orm";
import { db, schema } from "./client";
import { getSpendLogsTimeCondition, normalizeDays } from "./helpers";

const { spendLogs } = schema;

export async function getDailySpendTrend(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(asc(sql`DATE(${spendLogs.startTime})`));
  return result;
}

export async function getDailyTokenTrend(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      prompt_tokens: sql`SUM(${spendLogs.promptTokens})`.mapWith(Number),
      completion_tokens: sql`SUM(${spendLogs.completionTokens})`.mapWith(
        Number,
      ),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(asc(sql`DATE(${spendLogs.startTime})`));
  return result;
}

export async function getHourlyUsagePatterns(days = 7) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 7));
  const result = await db
    .select({
      hour: sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`,
      request_count: sql`COUNT(*)`.mapWith(Number),
      total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`)
    .orderBy(asc(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`));
  return result;
}
