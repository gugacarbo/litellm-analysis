import type { TimeRangeParams } from "../../types/index";
import { getModelProxyPrisma } from "./client";
import {
  buildProxyWhereClause,
  getProxyErrorFilter,
  getProxyTimeRangeFilterWhere,
  normalizeProxyDays,
  PROXY_REQUESTS_TABLE,
  proxyTimeCondition,
} from "./helpers";

export async function getMetricsSummary(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeProxyDays(days, 30);
  const timeFilter =
    params.startDate || params.endDate
      ? proxyTimeCondition(params)
      : getProxyTimeRangeFilterWhere({ days: normalizedDays });
  const errorTimeFilter = timeFilter;

  const prisma = getModelProxyPrisma();
  const summaryWhere = timeFilter ? `WHERE ${timeFilter}` : "";
  const errorWhere = errorTimeFilter
    ? `WHERE ${errorTimeFilter} AND ${getProxyErrorFilter()}`
    : `WHERE ${getProxyErrorFilter()}`;

  const [spendResult, errorResult] = await Promise.all([
    prisma.$queryRawUnsafe<
      Array<{
        totalSpend: number;
        totalTokens: number;
        activeModels: number;
        promptTokens: number;
        completionTokens: number;
        cachedTokens: number;
      }>
    >(`
      SELECT
        COALESCE(SUM("total_cost"), 0)::float as "totalSpend",
        COALESCE(SUM("total_tokens"), 0)::float as "totalTokens",
        COUNT(DISTINCT "model")::float as "activeModels",
        COALESCE(SUM("input_tokens"), 0)::float as "promptTokens",
        COALESCE(SUM("output_tokens"), 0)::float as "completionTokens",
        COALESCE(SUM("cached_tokens"), 0)::float as "cachedTokens"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${summaryWhere}
    `),
    prisma.$queryRawUnsafe<Array<{ errorCount: number }>>(`
      SELECT COUNT(*)::float as "errorCount"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${errorWhere}
    `),
  ]);

  const summary = spendResult[0];
  const errors = errorResult[0];

  return {
    totalSpend: Number(summary?.totalSpend ?? 0),
    totalTokens: Number(summary?.totalTokens ?? 0),
    activeModels: Number(summary?.activeModels ?? 0),
    errorCount: Number(errors?.errorCount ?? 0),
    promptTokens: Number(summary?.promptTokens ?? 0),
    completionTokens: Number(summary?.completionTokens ?? 0),
    cachedTokens: Number(summary?.cachedTokens ?? 0),
  };
}

export async function getPerformanceMetrics(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeProxyDays(days, 30);
  const timeParams =
    params.startDate || params.endDate ? params : { days: normalizedDays };
  const where = buildProxyWhereClause([
    proxyTimeCondition(timeParams),
    `"latency_ms" IS NOT NULL`,
    `"latency_ms" >= 100`,
  ]);

  const prisma = getModelProxyPrisma();
  const result = await prisma.$queryRawUnsafe<
    Array<{
      total_requests: number;
      avg_duration_ms: number;
      success_rate: number;
      avg_tokens_per_second: number;
    }>
  >(`
    SELECT
      COUNT(*)::float as "total_requests",
      AVG("latency_ms")::float as "avg_duration_ms",
      (SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100)::float as "success_rate",
      AVG(CASE WHEN "latency_ms" >= 500 THEN COALESCE("output_tokens", 0)::float / ("latency_ms"::float / 1000) ELSE NULL END)::float as "avg_tokens_per_second"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
  `);

  return (
    result[0] || {
      total_requests: 0,
      avg_duration_ms: 0,
      success_rate: 0,
      avg_tokens_per_second: 0,
    }
  );
}

export async function getCostEfficiency(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeProxyDays(days, 30);
  const timeParams =
    params.startDate || params.endDate ? params : { days: normalizedDays };
  const where = buildProxyWhereClause([proxyTimeCondition(timeParams)]);

  const prisma = getModelProxyPrisma();
  const result = await prisma.$queryRawUnsafe<
    Array<{
      model: string;
      total_spend: number;
      total_tokens: number;
      cost_per_1k_tokens: number;
      request_count: number;
    }>
  >(`
    SELECT
      "model",
      SUM("total_cost")::float as "total_spend",
      SUM("total_tokens")::float as "total_tokens",
      CASE
        WHEN SUM("total_tokens") > 0
        THEN SUM("total_cost") / SUM("total_tokens") * 1000
        ELSE 0
      END::float as "cost_per_1k_tokens",
      COUNT(*)::float as "request_count"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY "model"
    ORDER BY SUM("total_cost") DESC
    LIMIT 20
  `);

  return result;
}
