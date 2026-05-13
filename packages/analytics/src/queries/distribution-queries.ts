import { prisma } from "./client";
import { buildWhereClause, getTimeFilterWhere, normalizeDays } from "./helpers";

export async function getTokenDistribution(days = 30) {
  const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))]);

  const result = await prisma.$queryRawUnsafe<
    Array<{
      model: string;
      prompt_tokens: number;
      completion_tokens: number;
      avg_tokens_per_request: number;
      input_output_ratio: number;
    }>
  >(`
    SELECT
      "model",
      SUM("prompt_tokens")::int as "prompt_tokens",
      SUM("completion_tokens")::int as "completion_tokens",
      AVG("total_tokens")::float as "avg_tokens_per_request",
      CASE
        WHEN SUM("completion_tokens") > 0
        THEN SUM("prompt_tokens")::float / SUM("completion_tokens")
        ELSE 0
      END::float as "input_output_ratio"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "model"
    ORDER BY (SUM("prompt_tokens") + SUM("completion_tokens")) DESC
    LIMIT 20
  `);
  return result;
}

export async function getApiKeyDetailedStats(days = 30) {
  const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))]);

  const result = await prisma.$queryRawUnsafe<
    Array<{
      key: string;
      request_count: number;
      total_spend: number;
      total_tokens: number;
      avg_tokens_per_request: number;
      success_rate: number;
      last_used: Date;
    }>
  >(`
    SELECT
      "api_key" as "key",
      COUNT(*)::int as "request_count",
      SUM("spend")::float as "total_spend",
      SUM("total_tokens")::int as "total_tokens",
      AVG("total_tokens")::float as "avg_tokens_per_request",
      (SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100)::float as "success_rate",
      MAX("startTime") as "last_used"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "api_key"
    ORDER BY SUM("spend") DESC
    LIMIT 20
  `);
  return result;
}

export async function getModelRequestDistribution(days = 30) {
  const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))]);

  const totalResult = await prisma.$queryRawUnsafe<Array<{ count: number }>>(`
    SELECT COUNT(*)::int as "count"
    FROM "LiteLLM_SpendLogs"
    ${where}
  `);
  const totalCount = totalResult[0]?.count || 1;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      model: string;
      request_count: number;
      percentage: number;
    }>
  >(`
    SELECT
      "model",
      COUNT(*)::int as "request_count",
      (COUNT(*) * 100.0 / ${totalCount})::numeric(10, 2)::float as "percentage"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "model"
    ORDER BY COUNT(*) DESC
    LIMIT 15
  `);
  return result;
}

export async function getTopModelsByRequests(limit = 10, days = 30) {
  const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))]);

  const result = await prisma.$queryRawUnsafe<
    Array<{ model: string; request_count: number }>
  >(`
    SELECT "model", COUNT(*)::int as "request_count"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "model"
    ORDER BY COUNT(*) DESC
    LIMIT ${limit}
  `);
  return result;
}
