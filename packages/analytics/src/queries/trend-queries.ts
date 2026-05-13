import { prisma } from "./client";
import { buildWhereClause, getTimeFilterWhere, normalizeDays } from "./helpers";

function getTimeGranularity(days: number): "hour" | "day" {
  return days < 1 ? "hour" : "day";
}

function getTimeBucketExpressions(granularity: "hour" | "day") {
  if (granularity === "hour") {
    return {
      bucket: `date_trunc('hour', "startTime")`,
      label: `to_char(date_trunc('hour', "startTime"), 'YYYY-MM-DD HH24:MI')`,
    };
  }
  return {
    bucket: `DATE("startTime")`,
    label: `CAST(DATE("startTime") AS TEXT)`,
  };
}

export async function getDailySpendTrend(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const granularity = getTimeGranularity(normalizedDays);
  const { bucket, label } = getTimeBucketExpressions(granularity);
  const where = buildWhereClause([getTimeFilterWhere(normalizedDays)]);

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      spend: number;
      granularity: string;
    }>
  >(`
    SELECT
      ${label} as "date",
      SUM("spend")::float as "spend",
      '${granularity}' as "granularity"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY ${bucket}
    ORDER BY ${bucket} ASC
  `);
  return result;
}

export async function getDailyTokenTrend(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const granularity = getTimeGranularity(normalizedDays);
  const { bucket, label } = getTimeBucketExpressions(granularity);
  const where = buildWhereClause([getTimeFilterWhere(normalizedDays)]);

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      request_count: number;
      granularity: string;
    }>
  >(`
    SELECT
      ${label} as "date",
      SUM("prompt_tokens")::int as "prompt_tokens",
      SUM("completion_tokens")::int as "completion_tokens",
      SUM("total_tokens")::int as "total_tokens",
      COUNT(*)::int as "request_count",
      '${granularity}' as "granularity"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY ${bucket}
    ORDER BY ${bucket} ASC
  `);
  return result;
}

export async function getHourlySpendTrend(days = 1) {
  const normalizedDays = normalizeDays(days, 1);
  const where = buildWhereClause([getTimeFilterWhere(normalizedDays)]);

  const result = await prisma.$queryRawUnsafe<
    Array<{
      timestamp: string;
      hour: number;
      spend: number;
      total_tokens: number;
      request_count: number;
    }>
  >(`
    SELECT
      to_char(date_trunc('hour', "startTime"), 'YYYY-MM-DD HH24:MI') as "timestamp",
      EXTRACT(HOUR FROM date_trunc('hour', "startTime"))::int as "hour",
      SUM("spend")::float as "spend",
      SUM("total_tokens")::int as "total_tokens",
      COUNT(*)::int as "request_count"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY date_trunc('hour', "startTime")
    ORDER BY date_trunc('hour', "startTime") ASC
  `);
  return result;
}

export async function getHourlyUsagePatterns(days = 7) {
  const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 7))]);

  const result = await prisma.$queryRawUnsafe<
    Array<{
      hour: number;
      request_count: number;
      total_spend: number;
      total_tokens: number;
    }>
  >(`
    SELECT
      EXTRACT(HOUR FROM "startTime")::int as "hour",
      COUNT(*)::int as "request_count",
      SUM("spend")::float as "total_spend",
      SUM("total_tokens")::int as "total_tokens"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY EXTRACT(HOUR FROM "startTime")
    ORDER BY EXTRACT(HOUR FROM "startTime") ASC
  `);
  return result;
}
