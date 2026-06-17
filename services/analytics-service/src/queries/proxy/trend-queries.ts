import type { TimeRangeParams } from "../../types/index";
import { getModelProxyPrisma } from "./client";
import {
  buildProxyWhereClause,
  calculateDaysFromDateRange,
  getProxyTimeFilterWhere,
  normalizeProxyDays,
  PROXY_REQUESTS_TABLE,
  PROXY_TIME_COLUMN,
  proxyTimeCondition,
} from "./helpers";
import { resolveProxyTimeBucket } from "./time-buckets";

export async function getDailySpendTrend(params: TimeRangeParams = {}) {
  const days = calculateDaysFromDateRange(params);
  const normalizedDays = normalizeProxyDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } =
    await resolveProxyTimeBucket(normalizedDays);
  const where = buildProxyWhereClause([proxyTimeCondition(params)]);

  const prisma = getModelProxyPrisma();
  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      spend: number;
      granularity: string;
    }>
  >(`
    SELECT
      ${sqlLabel} as "date",
      COALESCE(SUM("total_cost"), 0)::float as "spend",
      '${granularity}' as "granularity"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY ${sqlBucket}
    ORDER BY MIN("${PROXY_TIME_COLUMN}") ASC
  `);
  return result;
}

export async function getDailyTokenTrend(params: TimeRangeParams = {}) {
  const days = calculateDaysFromDateRange(params);
  const normalizedDays = normalizeProxyDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } =
    await resolveProxyTimeBucket(normalizedDays);
  const where = buildProxyWhereClause([proxyTimeCondition(params)]);

  const prisma = getModelProxyPrisma();
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
      ${sqlLabel} as "date",
      SUM("input_tokens")::float as "prompt_tokens",
      SUM("output_tokens")::float as "completion_tokens",
      SUM("total_tokens")::float as "total_tokens",
      COUNT(*)::float as "request_count",
      '${granularity}' as "granularity"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY ${sqlBucket}
    ORDER BY MIN("${PROXY_TIME_COLUMN}") ASC
  `);
  return result;
}

export async function getHourlySpendTrend(days = 1) {
  const normalizedDays = normalizeProxyDays(days, 1);
  const where = buildProxyWhereClause([
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  const prisma = getModelProxyPrisma();
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
      to_char(date_trunc('hour', "${PROXY_TIME_COLUMN}"), 'YYYY-MM-DD HH24:MI') as "timestamp",
      EXTRACT(HOUR FROM date_trunc('hour', "${PROXY_TIME_COLUMN}"))::int as "hour",
      SUM("total_cost")::float as "spend",
      SUM("total_tokens")::float as "total_tokens",
      COUNT(*)::float as "request_count"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY date_trunc('hour', "${PROXY_TIME_COLUMN}")
    ORDER BY date_trunc('hour', "${PROXY_TIME_COLUMN}") ASC
  `);
  return result;
}

export async function getHourlyUsagePatterns(params: TimeRangeParams = {}) {
  const where = buildProxyWhereClause([proxyTimeCondition(params)]);

  const prisma = getModelProxyPrisma();
  const result = await prisma.$queryRawUnsafe<
    Array<{
      hour: number;
      request_count: number;
      total_spend: number;
      total_tokens: number;
    }>
  >(`
    SELECT
      EXTRACT(HOUR FROM "${PROXY_TIME_COLUMN}")::int as "hour",
      COUNT(*)::float as "request_count",
      SUM("total_cost")::float as "total_spend",
      SUM("total_tokens")::float as "total_tokens"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY EXTRACT(HOUR FROM "${PROXY_TIME_COLUMN}")
    ORDER BY EXTRACT(HOUR FROM "${PROXY_TIME_COLUMN}") ASC
  `);
  return result;
}
