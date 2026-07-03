import { queryRaw } from "@lite-llm/database/client";
import { sql } from "drizzle-orm";
import type { TimeRangeParams } from "../../types/index";
import {
  buildProxyWhereClause,
  getProxyTimeFilterWhere,
  normalizeProxyDays,
  PROXY_REQUESTS_TABLE,
  PROXY_TIME_COLUMN,
  proxyTimeCondition,
} from "./helpers";

export async function getSpendByModel(params: TimeRangeParams = {}) {
  const where = buildProxyWhereClause([proxyTimeCondition(params)]);

  const result = await queryRaw<{ model: string; total_spend: number }>(
    sql.raw(`
      SELECT "model", SUM("total_cost")::float as "total_spend"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY "model"
      ORDER BY SUM("total_cost") DESC
      LIMIT 20
    `),
    [],
  );

  return result;
}

export async function getTokenDistribution(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeProxyDays(days, 30);
  const timeParams =
    params.startDate || params.endDate ? params : { days: normalizedDays };
  const where = buildProxyWhereClause([proxyTimeCondition(timeParams)]);

  const result = await queryRaw<{
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    avg_tokens_per_request: number;
    input_output_ratio: number;
  }>(
    sql.raw(`
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
    `),
    [],
  );
  return result;
}

export async function getModelDistribution(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeProxyDays(days, 30);
  const timeParams =
    params.startDate || params.endDate ? params : { days: normalizedDays };
  const where = buildProxyWhereClause([proxyTimeCondition(timeParams)]);

  const totalResult = await queryRaw<{ count: number }>(
    sql.raw(`
      SELECT COUNT(*)::float as "count"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
    `),
    [],
  );
  const totalCount = totalResult[0]?.count || 1;

  const result = await queryRaw<{
    model: string;
    request_count: number;
    percentage: number;
  }>(
    sql.raw(`
      SELECT
        "model",
        COUNT(*)::float as "request_count",
        (COUNT(*) * 100.0 / ${totalCount})::numeric(10, 2)::float as "percentage"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY "model"
      ORDER BY COUNT(*) DESC
      LIMIT 15
    `),
    [],
  );
  return result;
}

export async function getSpendByUser(params: TimeRangeParams = {}) {
  const where = buildProxyWhereClause([
    proxyTimeCondition(params),
    `"end_user" IS NOT NULL`,
    `NULLIF(BTRIM("end_user"), '') IS NOT NULL`,
  ]);

  const result = await queryRaw<{
    user: string;
    total_spend: number;
    total_tokens: number;
    request_count: number;
  }>(
    sql.raw(`
      SELECT
        COALESCE(NULLIF(BTRIM("end_user"), ''), 'unknown') as "user",
        SUM("total_cost")::float as "total_spend",
        SUM("total_tokens")::float as "total_tokens",
        COUNT(*)::float as "request_count"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY COALESCE(NULLIF(BTRIM("end_user"), ''), 'unknown')
      ORDER BY SUM("total_cost") DESC
      LIMIT 20
    `),
    [],
  );

  return result;
}

export async function getSpendByKey(days = 30) {
  const where = buildProxyWhereClause([
    getProxyTimeFilterWhere(normalizeProxyDays(days, 30)),
    `"api_key_alias" IS NOT NULL`,
    `NULLIF(BTRIM("api_key_alias"), '') IS NOT NULL`,
  ]);

  const result = await queryRaw<{
    key: string;
    total_spend: number;
    total_tokens: number;
  }>(
    sql.raw(`
      SELECT
        COALESCE(NULLIF(BTRIM("api_key_alias"), ''), 'unknown') as "key",
        SUM("total_cost")::float as "total_spend",
        SUM("total_tokens")::float as "total_tokens"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY COALESCE(NULLIF(BTRIM("api_key_alias"), ''), 'unknown')
      ORDER BY SUM("total_cost") DESC
      LIMIT 20
    `),
    [],
  );

  return result;
}

export async function getApiKeyStats(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeProxyDays(days, 30);
  const timeParams =
    params.startDate || params.endDate ? params : { days: normalizedDays };
  const where = buildProxyWhereClause([
    proxyTimeCondition(timeParams),
    `"api_key_alias" IS NOT NULL`,
    `NULLIF(BTRIM("api_key_alias"), '') IS NOT NULL`,
  ]);

  const result = await queryRaw<{
    key: string;
    request_count: number;
    total_spend: number;
    total_tokens: number;
    avg_tokens_per_request: number;
    success_rate: number;
    avg_tokens_per_second: number;
    last_used: Date;
  }>(
    sql.raw(`
      SELECT
        COALESCE(NULLIF(BTRIM("api_key_alias"), ''), 'unknown') as "key",
        COUNT(*)::float as "request_count",
        SUM("total_cost")::float as "total_spend",
        SUM("total_tokens")::float as "total_tokens",
        AVG("total_tokens")::float as "avg_tokens_per_request",
        (SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100)::float as "success_rate",
        AVG(CASE WHEN "latency_ms" >= 500 THEN "output_tokens"::float / ("latency_ms"::float / 1000) ELSE NULL END)::float as "avg_tokens_per_second",
        MAX("${PROXY_TIME_COLUMN}") as "last_used"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY COALESCE(NULLIF(BTRIM("api_key_alias"), ''), 'unknown')
      ORDER BY SUM("total_cost") DESC
      LIMIT 20
    `),
    [],
  );
  return result;
}

export async function getTopModelsByRequests(limit = 10, days = 30) {
  const where = buildProxyWhereClause([
    getProxyTimeFilterWhere(normalizeProxyDays(days, 30)),
  ]);

  const result = await queryRaw<{ model: string; request_count: number }>(
    sql.raw(`
      SELECT "model", COUNT(*)::float as "request_count"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY "model"
      ORDER BY COUNT(*) DESC
      LIMIT ${limit}
    `),
    [],
  );
  return result;
}
