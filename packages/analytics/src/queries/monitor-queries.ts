import { prisma } from "./client";
import { combineSqlConditions, getFailedSpendLogsFilter } from "./helpers";

export async function getErrorsSince(since: Date, limit = 100) {
  const timeFilter = `"startTime" > '${since.toISOString()}'`;
  const failedFilter = getFailedSpendLogsFilter();
  const where = `WHERE ${combineSqlConditions([timeFilter, failedFilter])}`;

  try {
    return await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
      SELECT
        sl."request_id" as "id",
        COALESCE(el."exception_type", sl."status", 'error') as "error_type",
        sl."model",
        sl."user",
        COALESCE(
          NULLIF(BTRIM(el."exception_string"), ''),
          sl."status",
          'Request failed'
        ) as "error_message",
        sl."startTime" as "timestamp",
        COALESCE(el."status_code", '500') as "status_code",
        el."litellm_model_name",
        el."request_kwargs",
        sl."api_key",
        sl."status" as "spend_status",
        sl."total_tokens",
        sl."prompt_tokens",
        sl."completion_tokens",
        sl."spend",
        sl."endTime" as "end_time"
      FROM "LiteLLM_SpendLogs" sl
      LEFT JOIN "LiteLLM_ErrorLogs" el ON el."request_id" = sl."request_id"
      ${where}
      ORDER BY sl."startTime" DESC
      LIMIT ${limit}
    `);
  } catch {
    return await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
      SELECT
        "request_id" as "id",
        COALESCE(NULLIF(BTRIM("status"), ''), 'error') as "error_type",
        "model",
        "user",
        COALESCE(
          NULLIF(BTRIM("status"), ''),
          'Request failed'
        ) as "error_message",
        "startTime" as "timestamp",
        '500' as "status_code",
        NULL as "litellm_model_name",
        NULL as "request_kwargs",
        "api_key",
        COALESCE(NULLIF(BTRIM("status"), ''), 'error') as "spend_status",
        "total_tokens",
        "prompt_tokens",
        "completion_tokens",
        "spend",
        "endTime" as "end_time"
      FROM "LiteLLM_SpendLogs"
      ${where}
      ORDER BY "startTime" DESC
      LIMIT ${limit}
    `);
  }
}

export async function getErrorCountByModelSince(since: Date) {
  const timeFilter = `"startTime" > '${since.toISOString()}'`;
  const failedFilter = getFailedSpendLogsFilter();
  const where = `WHERE ${combineSqlConditions([timeFilter, failedFilter])}`;

  return prisma.$queryRawUnsafe<Array<{ model: string; error_count: number }>>(`
    SELECT "model", COUNT(*)::int as "error_count"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "model"
    ORDER BY COUNT(*) DESC
  `);
}

export async function getModelHealthSince(params: {
  model: string;
  since: Date;
  baselineHours: number;
}) {
  const { model, since } = params;
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    `"startTime" > '${since.toISOString()}'`,
    `"endTime" IS NOT NULL`,
  ])}`;

  const result = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      COUNT(*)::int as "total_requests",
      SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::int as "success_count",
      SUM(CASE WHEN "status" != 'success' THEN 1 ELSE 0 END)::int as "error_count",
      AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "avg_latency_ms",
      MAX(CASE WHEN "status" = 'success' THEN "startTime"::text ELSE NULL END) as "last_success_at",
      MAX(CASE WHEN "status" != 'success' THEN "startTime"::text ELSE NULL END) as "last_error_at",
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p95_latency_ms"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "model"
  `);

  return result;
}

export async function getStuckRequests(since: Date) {
  return prisma.$queryRawUnsafe<
    Array<{
      request_id: string;
      model: string;
      startTime: Date;
    }>
  >(`
    SELECT "request_id", "model", "startTime"
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" > '${since.toISOString()}' AND "endTime" IS NULL
    ORDER BY "startTime" ASC
    LIMIT 1000
  `);
}

export async function getSpendAnomaliesSince(since: Date, threshold = 10) {
  return prisma.$queryRawUnsafe<
    Array<{
      request_id: string;
      model: string;
      spend: number;
      total_tokens: number;
      start_time: Date;
      status: string;
    }>
  >(`
    SELECT "request_id", "model", "spend", "total_tokens", "startTime" as "start_time", "status"
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" > '${since.toISOString()}' AND "spend" >= ${threshold}
    ORDER BY "spend" DESC
    LIMIT 100
  `);
}

export async function getSpendByModelSince(since: Date) {
  return prisma.$queryRawUnsafe<
    Array<{
      model: string;
      total_spend: number;
      request_count: number;
      avg_spend: number;
    }>
  >(`
    SELECT
      "model",
      COALESCE(SUM("spend"), 0)::float as "total_spend",
      COUNT("request_id")::int as "request_count",
      COALESCE(AVG("spend"), 0)::float as "avg_spend"
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" > '${since.toISOString()}'
    GROUP BY "model"
  `);
}

export async function getNonSuccessLogsSince(since: Date, limit = 500) {
  const failedFilter = getFailedSpendLogsFilter();
  const where = `WHERE ${combineSqlConditions([
    `"startTime" > '${since.toISOString()}'`,
    failedFilter,
  ])}`;

  return prisma.$queryRawUnsafe<
    Array<{
      request_id: string;
      model: string;
      spend: number;
      status: string;
      start_time: Date;
      end_time: Date;
      error_message: string | null;
    }>
  >(`
    SELECT
      sl."request_id",
      sl."model",
      sl."spend",
      sl."status",
      sl."startTime" as "start_time",
      sl."endTime" as "end_time",
      el."exception_string" as "error_message"
    FROM "LiteLLM_SpendLogs" sl
    LEFT JOIN "LiteLLM_ErrorLogs" el ON sl."request_id" = el."request_id"
    ${where}
    ORDER BY sl."startTime" DESC
    LIMIT ${limit}
  `);
}

export async function getNonSuccessCountByModelSince(since: Date) {
  const failedFilter = getFailedSpendLogsFilter();
  const where = `WHERE ${combineSqlConditions([
    `"startTime" > '${since.toISOString()}'`,
    failedFilter,
  ])}`;

  return prisma.$queryRawUnsafe<
    Array<{
      model: string;
      non_success_count: number;
    }>
  >(`
    SELECT "model", COUNT("request_id")::int as "non_success_count"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "model"
  `);
}

export async function getLowThroughputRequestsSince(
  since: Date,
  threshold = 10,
  limit = 100,
) {
  return prisma.$queryRawUnsafe<
    Array<{
      request_id: string;
      model: string;
      completion_tokens: number;
      tokens_per_second: number;
      start_time: Date;
      end_time: Date;
    }>
  >(`
    SELECT
      "request_id",
      "model",
      "completion_tokens",
      CASE
        WHEN EXTRACT(EPOCH FROM ("endTime" - "startTime")) > 0.5
        THEN "completion_tokens" / EXTRACT(EPOCH FROM ("endTime" - "startTime"))
        ELSE 0
      END::float as "tokens_per_second",
      "startTime" as "start_time",
      "endTime" as "end_time"
    FROM "LiteLLM_SpendLogs"
    WHERE
      "startTime" > '${since.toISOString()}'
      AND "endTime" IS NOT NULL
      AND "completion_tokens" > 0
      AND LOWER("status") = 'success'
      AND CASE
        WHEN EXTRACT(EPOCH FROM ("endTime" - "startTime")) > 0.5
        THEN "completion_tokens" / EXTRACT(EPOCH FROM ("endTime" - "startTime"))
        ELSE 0
      END < ${threshold}
    ORDER BY CASE
      WHEN EXTRACT(EPOCH FROM ("endTime" - "startTime")) > 0.5
      THEN "completion_tokens" / EXTRACT(EPOCH FROM ("endTime" - "startTime"))
      ELSE 0
    END ASC
    LIMIT ${limit}
  `);
}
