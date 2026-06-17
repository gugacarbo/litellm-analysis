import { getModelProxyPrisma } from "./client";
import {
  buildProxyWhereClause,
  combineProxyConditions,
  getProxyErrorFilter,
  getProxyNonSuccessFilter,
  PROXY_REQUESTS_TABLE,
  PROXY_TIME_COLUMN,
} from "./helpers";

export async function getErrorsSince(since: Date, limit = 100) {
  const timeFilter = `"${PROXY_TIME_COLUMN}" > '${since.toISOString()}'`;
  const where = buildProxyWhereClause([timeFilter, getProxyErrorFilter()]);
  const prisma = getModelProxyPrisma();

  return prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      "id",
      COALESCE(NULLIF(BTRIM("error_type"), ''), "status", 'error') as "error_type",
      "model",
      COALESCE(
        NULLIF(BTRIM("error_message"), ''),
        NULLIF(BTRIM("error_summary"), ''),
        "status",
        'Request failed'
      ) as "error_message",
      "${PROXY_TIME_COLUMN}" as "timestamp",
      COALESCE("error_status_code", 500) as "status_code",
      "upstream_model" as "upstream_model_name",
      "error_details" as "request_kwargs",
      "status" as "spend_status",
      "total_tokens",
      "input_tokens" as "prompt_tokens",
      "output_tokens" as "completion_tokens",
      "total_cost" as "spend",
      "finished_at" as "end_time"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    ORDER BY "${PROXY_TIME_COLUMN}" DESC
    LIMIT ${limit}
  `);
}

export async function getErrorCountByModelSince(since: Date) {
  const timeFilter = `"${PROXY_TIME_COLUMN}" > '${since.toISOString()}'`;
  const where = buildProxyWhereClause([timeFilter, getProxyErrorFilter()]);
  const prisma = getModelProxyPrisma();

  return prisma.$queryRawUnsafe<Array<{ model: string; error_count: number }>>(`
    SELECT "model", COUNT(*)::float as "error_count"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY "model"
    ORDER BY COUNT(*) DESC
  `);
}

export async function getNonSuccessCountByModelSince(since: Date) {
  const timeFilter = `"${PROXY_TIME_COLUMN}" > '${since.toISOString()}'`;
  const where = buildProxyWhereClause([timeFilter, getProxyNonSuccessFilter()]);
  const prisma = getModelProxyPrisma();

  return prisma.$queryRawUnsafe<
    Array<{
      model: string;
      non_success_count: number;
    }>
  >(`
    SELECT "model", COUNT(*)::float as "non_success_count"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY "model"
  `);
}

export async function getModelHealthSince(params: {
  model: string;
  since: Date;
  baselineHours: number;
}) {
  const { model, since } = params;
  const where = buildProxyWhereClause([
    `"model" = '${model}'`,
    `"${PROXY_TIME_COLUMN}" > '${since.toISOString()}'`,
    `"finished_at" IS NOT NULL`,
    `"latency_ms" IS NOT NULL`,
  ]);
  const prisma = getModelProxyPrisma();

  return prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      COUNT(*)::float as "total_requests",
      SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::float as "success_count",
      SUM(CASE WHEN "status" != 'success' THEN 1 ELSE 0 END)::float as "error_count",
      AVG("latency_ms")::float as "avg_latency_ms",
      MAX(CASE WHEN "status" = 'success' THEN "${PROXY_TIME_COLUMN}"::text ELSE NULL END) as "last_success_at",
      MAX(CASE WHEN "status" != 'success' THEN "${PROXY_TIME_COLUMN}"::text ELSE NULL END) as "last_error_at",
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "latency_ms")::float as "p95_latency_ms"
    FROM "${PROXY_REQUESTS_TABLE}"
    ${where}
    GROUP BY "model"
  `);
}

export async function getStuckRequests(threshold: Date) {
  const where = combineProxyConditions([
    `"status" = 'started'`,
    `"${PROXY_TIME_COLUMN}" < '${threshold.toISOString()}'`,
  ]);
  const prisma = getModelProxyPrisma();

  return prisma.$queryRawUnsafe<
    Array<{
      request_id: string;
      model: string;
      startTime: Date;
    }>
  >(`
    SELECT "id" as "request_id", "model", "${PROXY_TIME_COLUMN}" as "startTime"
    FROM "${PROXY_REQUESTS_TABLE}"
    WHERE ${where}
    ORDER BY "${PROXY_TIME_COLUMN}" ASC
    LIMIT 1000
  `);
}
