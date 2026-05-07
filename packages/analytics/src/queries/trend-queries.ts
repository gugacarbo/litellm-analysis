import { asc, sql } from "drizzle-orm";
import { litellmDb, schema } from "./client";
import { getSpendLogsTimeCondition, normalizeDays } from "./helpers";

const { spendLogs } = schema;

/**
 * Determines granularity based on time range.
 * - For ranges < 1 day: group by hour
 * - For ranges >= 1 day: group by day
 */
function getTimeGranularity(days: number): "hour" | "day" {
  return days < 1 ? "hour" : "day";
}

/**
 * Get time bucket expression based on granularity.
 * Returns SQL expression for grouping and label.
 */
function getTimeBucketExpressions(granularity: "hour" | "day") {
  if (granularity === "hour") {
    return {
      // Format: "2024-01-15 14:00"
      bucket: sql`date_trunc('hour', ${spendLogs.startTime})`,
      label: sql`to_char(date_trunc('hour', ${spendLogs.startTime}), 'YYYY-MM-DD HH24:MI')`,
    };
  }
  return {
    // Format: "2024-01-15"
    bucket: sql`DATE(${spendLogs.startTime})`,
    label: sql`CAST(DATE(${spendLogs.startTime}) AS TEXT)`,
  };
}

export async function getDailySpendTrend(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const granularity = getTimeGranularity(normalizedDays);
  const { bucket, label } = getTimeBucketExpressions(granularity);
  const whereClause = getSpendLogsTimeCondition(normalizedDays);

  const result = await litellmDb
    .select({
      date: label,
      spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      granularity: sql`${granularity}`.mapWith(String),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(bucket)
    .orderBy(asc(bucket));
  return result;
}

export async function getDailyTokenTrend(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const granularity = getTimeGranularity(normalizedDays);
  const { bucket, label } = getTimeBucketExpressions(granularity);
  const whereClause = getSpendLogsTimeCondition(normalizedDays);

  return litellmDb
    .select({
      date: label,
      prompt_tokens: sql`SUM(${spendLogs.promptTokens})`.mapWith(Number),
      completion_tokens: sql`SUM(${spendLogs.completionTokens})`.mapWith(
        Number,
      ),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      request_count: sql`COUNT(*)`.mapWith(Number),
      granularity: sql`${granularity}`.mapWith(String),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(bucket)
    .orderBy(asc(bucket));
}

/**
 * Hourly spend trend for short time ranges (< 1 day).
 * Groups by hour and returns timestamps formatted for charts.
 */
export async function getHourlySpendTrend(days = 1) {
  const normalizedDays = normalizeDays(days, 1);
  // Only use hourly granularity for ranges < 24h
  const whereClause = getSpendLogsTimeCondition(normalizedDays);

  const result = await litellmDb
    .select({
      // Format: "2024-01-15 14:00"
      timestamp: sql`to_char(date_trunc('hour', ${spendLogs.startTime}), 'YYYY-MM-DD HH24:MI')`,
      hour: sql`EXTRACT(HOUR FROM date_trunc('hour', ${spendLogs.startTime}))`.mapWith(
        Number,
      ),
      spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      request_count: sql`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`date_trunc('hour', ${spendLogs.startTime})`)
    .orderBy(asc(sql`date_trunc('hour', ${spendLogs.startTime})`));
  return result;
}

export async function getHourlyUsagePatterns(days = 7) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 7));
  const result = await litellmDb
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
