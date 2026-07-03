import { db, queryRaw } from "@lite-llm/database/client";
import { modelProxyRequests } from "@lite-llm/database/schema/model-proxy";
import { eq, sql } from "drizzle-orm";
import type { TimeRangeParams } from "../../types/index";
import {
  buildProxyWhereClause,
  combineProxyConditions,
  getProxyTimeFilterWhere,
  getProxyTimeRangeFilterWhere,
  normalizeProxyDays,
  PROXY_REQUESTS_TABLE,
  PROXY_TIME_COLUMN,
} from "./helpers";
import { resolveProxyTimeBucket } from "./time-buckets";

const MODELS_TABLE = "model_proxy_models";

export async function getModelStatistics(params: TimeRangeParams = {}) {
  const days = params.days ?? 30;
  const normalizedDays = normalizeProxyDays(days, 30);
  const timeCondition =
    params.startDate || params.endDate
      ? getProxyTimeRangeFilterWhere(params)
      : getProxyTimeFilterWhere(normalizedDays);
  const where = buildProxyWhereClause([
    timeCondition,
    `"finished_at" IS NOT NULL`,
    `"latency_ms" >= 100`,
  ]);

  return queryRaw<Record<string, unknown>>(
    sql.raw(`
      SELECT
        "model",
        COUNT(*)::float as "request_count",
        SUM("total_cost")::float as "total_spend",
        SUM("total_tokens")::float as "total_tokens",
        SUM("input_tokens")::float as "prompt_tokens",
        SUM("output_tokens")::float as "completion_tokens",
        AVG("total_tokens")::float as "avg_tokens_per_request",
        AVG("latency_ms")::float as "avg_latency_ms",
        (SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100)::float as "success_rate",
        SUM(CASE WHEN "status" != 'success' THEN 1 ELSE 0 END)::float as "error_count",
        AVG(CASE WHEN "input_tokens" > 0 THEN "total_cost" * "input_tokens"::float / NULLIF("total_tokens", 0) ELSE 0 END)::float as "avg_input_cost",
        AVG(CASE WHEN "output_tokens" > 0 THEN "total_cost" * "output_tokens"::float / NULLIF("total_tokens", 0) ELSE 0 END)::float as "avg_output_cost",
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "latency_ms")::float as "p50_latency_ms",
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "latency_ms")::float as "p95_latency_ms",
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "latency_ms")::float as "p99_latency_ms",
        MIN("${PROXY_TIME_COLUMN}") as "first_seen",
        MAX("${PROXY_TIME_COLUMN}") as "last_seen",
        COUNT(DISTINCT NULLIF(BTRIM("end_user"), ''))::float as "unique_users",
        COUNT(DISTINCT NULLIF(BTRIM("api_key_alias"), ''))::float as "unique_api_keys",
        AVG(CASE WHEN "latency_ms" >= 500 THEN "output_tokens"::float / ("latency_ms"::float / 1000) ELSE NULL END)::float as "avg_tokens_per_second",
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CASE WHEN "latency_ms" >= 500 THEN "output_tokens"::float / ("latency_ms"::float / 1000) ELSE NULL END)::float as "p50_tokens_per_second",
        MAX(CASE WHEN "latency_ms" >= 500 THEN "output_tokens"::float / ("latency_ms"::float / 1000) ELSE NULL END)::float as "max_tokens_per_second"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY "model"
      ORDER BY SUM("total_cost") DESC
      LIMIT 50
    `),
    [],
  );
}

export async function mergeModels(sourceModel: string, targetModel: string) {
  await db
    .update(modelProxyRequests)
    .set({ model: targetModel })
    .where(eq(modelProxyRequests.model, sourceModel));
}

export async function deleteModelLogs(modelName: string) {
  if (modelName.trim() === "") {
    await db.execute(
      sql.raw(`
      DELETE FROM "${PROXY_REQUESTS_TABLE}"
      WHERE NULLIF(BTRIM("model"), '') IS NULL
    `),
    );
    return;
  }

  await db
    .delete(modelProxyRequests)
    .where(eq(modelProxyRequests.model, modelName));
}

export async function getDailySpendTrendByModel(model: string, days?: number) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } =
    await resolveProxyTimeBucket(normalizedDays);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  return queryRaw<{
    date: string;
    spend: number;
    total_tokens: number;
    request_count: number;
    granularity: string;
  }>(
    sql.raw(`
      SELECT
        ${sqlLabel} as "date",
        SUM("total_cost")::float as "spend",
        SUM("total_tokens")::float as "total_tokens",
        COUNT(*)::float as "request_count",
        '${granularity}' as "granularity"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY ${sqlBucket}
      ORDER BY MIN("${PROXY_TIME_COLUMN}") ASC
    `),
    [],
  );
}

export async function getDailyTokenTrendByModel(model: string, days?: number) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } =
    await resolveProxyTimeBucket(normalizedDays);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  return queryRaw<{
    date: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    granularity: string;
  }>(
    sql.raw(`
      SELECT
        ${sqlLabel} as "date",
        SUM("input_tokens")::float as "prompt_tokens",
        SUM("output_tokens")::float as "completion_tokens",
        SUM("total_tokens")::float as "total_tokens",
        '${granularity}' as "granularity"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY ${sqlBucket}
      ORDER BY MIN("${PROXY_TIME_COLUMN}") ASC
    `),
    [],
  );
}

export async function getHourlyUsageByModel(model: string, days?: number) {
  const normalizedDays = normalizeProxyDays(days, 7);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  return queryRaw<{
    hour: number;
    request_count: number;
    total_spend: number;
    total_tokens: number;
  }>(
    sql.raw(`
      SELECT
        EXTRACT(HOUR FROM "${PROXY_TIME_COLUMN}")::int as "hour",
        COUNT(*)::float as "request_count",
        SUM("total_cost")::float as "total_spend",
        SUM("total_tokens")::float as "total_tokens"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY EXTRACT(HOUR FROM "${PROXY_TIME_COLUMN}")
      ORDER BY EXTRACT(HOUR FROM "${PROXY_TIME_COLUMN}")
    `),
    [],
  );
}

export async function getDailyLatencyTrendByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } =
    await resolveProxyTimeBucket(normalizedDays);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    `"finished_at" IS NOT NULL`,
    `"latency_ms" IS NOT NULL`,
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  return queryRaw<{
    date: string;
    avg_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    granularity: string;
  }>(
    sql.raw(`
      SELECT
        ${sqlLabel} as "date",
        AVG("latency_ms")::float as "avg_latency_ms",
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "latency_ms")::float as "p50_latency_ms",
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "latency_ms")::float as "p95_latency_ms",
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "latency_ms")::float as "p99_latency_ms",
        '${granularity}' as "granularity"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY ${sqlBucket}
      ORDER BY MIN("${PROXY_TIME_COLUMN}") ASC
    `),
    [],
  );
}

export async function getErrorBreakdownByModel(model: string, days?: number) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    `"status" != 'success'`,
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  return queryRaw<{
    error_type: string;
    count: number;
    last_occurred: Date;
  }>(
    sql.raw(`
      SELECT
        COALESCE(NULLIF(BTRIM("error_type"), ''), "status", 'error') as "error_type",
        COUNT(*)::float as "count",
        MAX("${PROXY_TIME_COLUMN}") as "last_occurred"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY COALESCE(NULLIF(BTRIM("error_type"), ''), "status", 'error')
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `),
    [],
  );
}

export async function getDailyErrorTrendByModel(model: string, days?: number) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } =
    await resolveProxyTimeBucket(normalizedDays);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    `"status" != 'success'`,
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  return queryRaw<{ date: string; error_count: number; granularity: string }>(
    sql.raw(`
      SELECT
        ${sqlLabel} as "date",
        COUNT(*)::float as "error_count",
        '${granularity}' as "granularity"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY ${sqlBucket}
      ORDER BY MIN("${PROXY_TIME_COLUMN}") ASC
    `),
    [],
  );
}

export async function getModelCacheHitRateByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  const result = await queryRaw<{
    cache_hits: number;
    total_requests: number;
    cache_hit_rate: number;
  }>(
    sql.raw(`
      SELECT
        COALESCE(SUM("cached_tokens"), 0)::float as "cache_hits",
        COALESCE(SUM("input_tokens"), 0)::float as "total_requests",
        ROUND(
          COALESCE(SUM("cached_tokens"), 0) * 100.0
          / NULLIF(SUM("input_tokens"), 0),
          2
        )::float as "cache_hit_rate"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
    `),
    [],
  );

  return result[0] || { cache_hits: 0, total_requests: 0, cache_hit_rate: 0 };
}

export async function getModelTTFTPercentilesByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    `"ttft_ms" IS NOT NULL`,
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  const result = await queryRaw<{
    avg_ttft_ms: number;
    p50_ttft_ms: number;
    p95_ttft_ms: number;
    p99_ttft_ms: number;
    min_ttft_ms: number;
    max_ttft_ms: number;
  }>(
    sql.raw(`
      SELECT
        AVG("ttft_ms")::float as "avg_ttft_ms",
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "ttft_ms")::float as "p50_ttft_ms",
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "ttft_ms")::float as "p95_ttft_ms",
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "ttft_ms")::float as "p99_ttft_ms",
        MIN("ttft_ms")::float as "min_ttft_ms",
        MAX("ttft_ms")::float as "max_ttft_ms"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
    `),
    [],
  );

  return (
    result[0] || {
      avg_ttft_ms: 0,
      p50_ttft_ms: 0,
      p95_ttft_ms: 0,
      p99_ttft_ms: 0,
      min_ttft_ms: 0,
      max_ttft_ms: 0,
    }
  );
}

export async function getModelStatusDistributionByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    getProxyTimeFilterWhere(normalizedDays),
  ]);

  return queryRaw<{
    status: string;
    count: number;
    percentage: number;
  }>(
    sql.raw(`
      SELECT
        COALESCE("status", 'started') as "status",
        COUNT(*)::float as "count",
        ROUND(
          COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0),
          2
        )::float as "percentage"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY COALESCE("status", 'started')
      ORDER BY COUNT(*) DESC
      LIMIT 20
    `),
    [],
  );
}

export async function getModelProviderBreakdownByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const where = combineProxyConditions([
    `r."model" = '${model}'`,
    `"finished_at" IS NOT NULL`,
    getProxyTimeFilterWhere(normalizedDays).replaceAll(
      `"${PROXY_TIME_COLUMN}"`,
      `r."${PROXY_TIME_COLUMN}"`,
    ),
  ]);

  return queryRaw<{
    provider: string;
    request_count: number;
    total_spend: number;
    avg_latency_ms: number;
  }>(
    sql.raw(`
      SELECT
        COALESCE(NULLIF(BTRIM(m."owned_by"), ''), NULLIF(BTRIM(r."upstream_base_url"), ''), 'unknown') as "provider",
        COUNT(*)::float as "request_count",
        SUM(r."total_cost")::float as "total_spend",
        AVG(r."latency_ms")::float as "avg_latency_ms"
      FROM "${PROXY_REQUESTS_TABLE}" r
      LEFT JOIN "${MODELS_TABLE}" m ON m."model_name" = r."model"
      WHERE ${where}
      GROUP BY COALESCE(NULLIF(BTRIM(m."owned_by"), ''), NULLIF(BTRIM(r."upstream_base_url"), ''), 'unknown')
      ORDER BY SUM(r."total_cost") DESC
    `),
    [],
  );
}

export async function getTopUsersByModel(model: string, days?: number) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    getProxyTimeFilterWhere(normalizedDays),
    `"end_user" IS NOT NULL`,
    `NULLIF(BTRIM("end_user"), '') IS NOT NULL`,
  ]);

  return queryRaw<{
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
}

export async function getTopApiKeysByModel(model: string, days?: number) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    getProxyTimeFilterWhere(normalizedDays),
    `"api_key_alias" IS NOT NULL`,
    `NULLIF(BTRIM("api_key_alias"), '') IS NOT NULL`,
  ]);

  return queryRaw<{
    api_key: string;
    total_spend: number;
    total_tokens: number;
    request_count: number;
    success_rate: number;
    avg_tokens_per_second: number;
  }>(
    sql.raw(`
      SELECT
        COALESCE(NULLIF(BTRIM("api_key_alias"), ''), 'unknown') as "api_key",
        SUM("total_cost")::float as "total_spend",
        SUM("total_tokens")::float as "total_tokens",
        COUNT(*)::float as "request_count",
        (SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100)::float as "success_rate",
        AVG(CASE WHEN "latency_ms" >= 500 THEN "output_tokens"::float / ("latency_ms"::float / 1000) ELSE NULL END)::float as "avg_tokens_per_second"
      FROM "${PROXY_REQUESTS_TABLE}"
      ${where}
      GROUP BY COALESCE(NULLIF(BTRIM("api_key_alias"), ''), 'unknown')
      ORDER BY SUM("total_cost") DESC
      LIMIT 20
    `),
    [],
  );
}
