import type { TimeRangeParams } from "../types/index";
import { prisma } from "./client";
import {
  buildWhereClause,
  getTimeRangeFilterWhere,
  normalizeDays,
} from "./helpers";

function getTimeCondition(params: TimeRangeParams): string {
  return getTimeRangeFilterWhere(params);
}

export async function getMetricsSummary(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeDays(days, 30);
  const timeFilter =
    params.startDate || params.endDate
      ? getTimeCondition(params)
      : getTimeRangeFilterWhere({ days: normalizedDays });
  const errorTimeFilter = timeFilter;

  const [spendResult, errorResult] = await Promise.all([
    prisma.$queryRawUnsafe<
      Array<{
        totalSpend: number;
        totalTokens: number;
        activeModels: number;
        promptTokens: number;
        completionTokens: number;
      }>
    >(`
      SELECT
        COALESCE(SUM("spend"), 0)::float as "totalSpend",
        COALESCE(SUM("total_tokens"), 0)::float as "totalTokens",
        COUNT(DISTINCT "model")::float as "activeModels",
        COALESCE(SUM("prompt_tokens"), 0)::float as "promptTokens",
        COALESCE(SUM("completion_tokens"), 0)::float as "completionTokens"
      FROM "LiteLLM_SpendLogs"
      ${timeFilter ? `WHERE ${timeFilter}` : ""}
    `),
    prisma.$queryRawUnsafe<Array<{ errorCount: number }>>(`
      SELECT COUNT(*)::float as "errorCount"
      FROM "LiteLLM_SpendLogs"
      ${
        errorTimeFilter
          ? `WHERE ${errorTimeFilter} AND LOWER(COALESCE("status", '')) != 'success'`
          : `WHERE LOWER(COALESCE("status", '')) != 'success'`
      }
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
  };
}

export async function getPerformanceMetrics(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeDays(days, 30);
  const timeParams =
    params.startDate || params.endDate ? params : { days: normalizedDays };
  const where = buildWhereClause([
    getTimeCondition(timeParams),
    `"endTime" IS NOT NULL`,
    `EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= 0.1`,
  ]);

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
      AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "avg_duration_ms",
      (SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100)::float as "success_rate",
      AVG(CASE WHEN EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= 0.5 THEN "completion_tokens"::float / EXTRACT(EPOCH FROM ("endTime" - "startTime")) ELSE NULL END)::float as "avg_tokens_per_second"
    FROM "LiteLLM_SpendLogs"
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

export async function getCostEfficiencyByModel(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeDays(days, 30);
  const timeParams =
    params.startDate || params.endDate ? params : { days: normalizedDays };
  const where = buildWhereClause([getTimeCondition(timeParams)]);

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
      SUM("spend")::float as "total_spend",
      SUM("total_tokens")::float as "total_tokens",
      CASE
        WHEN SUM("total_tokens") > 0
        THEN SUM("spend") / SUM("total_tokens") * 1000
        ELSE 0
      END::float as "cost_per_1k_tokens",
      COUNT(*)::float as "request_count"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "model"
    ORDER BY SUM("spend") DESC
    LIMIT 20
  `);

  return result;
}
