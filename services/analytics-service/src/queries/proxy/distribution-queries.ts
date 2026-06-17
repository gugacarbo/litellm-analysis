import type { TimeRangeParams } from "../../types/index";
import { getModelProxyPrisma } from "./client";
import {
  buildProxyWhereClause,
  getProxyTimeFilterWhere,
  normalizeProxyDays,
  PROXY_REQUESTS_TABLE,
  proxyTimeCondition,
} from "./helpers";

export async function getSpendByModel(params: TimeRangeParams = {}) {
  const where = buildProxyWhereClause([proxyTimeCondition(params)]);

  const prisma = getModelProxyPrisma();
  const result = await prisma.$queryRawUnsafe<
    Array<{ model: string; total_spend: number }>
  >(`
    SELECT "model", SUM("total_cost")::float as "total_spend"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY "model"
    ORDER BY SUM("total_cost") DESC
    LIMIT 20
  `);

  return result;
}

export async function getTokenDistribution(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeProxyDays(days, 30);
  const timeParams =
    params.startDate || params.endDate ? params : { days: normalizedDays };
  const where = buildProxyWhereClause([proxyTimeCondition(timeParams)]);

  const prisma = getModelProxyPrisma();
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
      SUM("input_tokens")::float as "prompt_tokens",
      SUM("output_tokens")::float as "completion_tokens",
      AVG("total_tokens")::float as "avg_tokens_per_request",
      CASE
        WHEN SUM("output_tokens") > 0
        THEN SUM("input_tokens")::float / SUM("output_tokens")
        ELSE 0
      END::float as "input_output_ratio"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY "model"
    ORDER BY (SUM("input_tokens") + SUM("output_tokens")) DESC
    LIMIT 20
  `);
  return result;
}

export async function getModelDistribution(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeProxyDays(days, 30);
  const timeParams =
    params.startDate || params.endDate ? params : { days: normalizedDays };
  const where = buildProxyWhereClause([proxyTimeCondition(timeParams)]);

  const prisma = getModelProxyPrisma();
  const totalResult = await prisma.$queryRawUnsafe<Array<{ count: number }>>(`
    SELECT COUNT(*)::float as "count"
    FROM "${PROXY_REQUESTS_TABLE}"
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
      COUNT(*)::float as "request_count",
      (COUNT(*) * 100.0 / ${totalCount})::numeric(10, 2)::float as "percentage"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY "model"
    ORDER BY COUNT(*) DESC
    LIMIT 15
  `);
  return result;
}

export async function getSpendByUser(): Promise<[]> {
  return [];
}

export async function getSpendByKey(): Promise<[]> {
  return [];
}

export async function getApiKeyStats(): Promise<[]> {
  return [];
}

export async function getTopModelsByRequests(limit = 10, days = 30) {
  const where = buildProxyWhereClause([
    getProxyTimeFilterWhere(normalizeProxyDays(days, 30)),
  ]);

  const prisma = getModelProxyPrisma();
  const result = await prisma.$queryRawUnsafe<
    Array<{ model: string; request_count: number }>
  >(`
    SELECT "model", COUNT(*)::float as "request_count"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY "model"
    ORDER BY COUNT(*) DESC
    LIMIT ${limit}
  `);
  return result;
}
