import { prisma } from "./client";
import {
  combineSqlConditions,
  getFailedSpendLogsFilter,
  getTimeFilterWhere,
  normalizeDays,
} from "./helpers";

export async function getErrorLogs(limit = 50, days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const timeFilter = getTimeFilterWhere(normalizedDays);
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
        COALESCE(
          NULLIF(BTRIM("status"), ''),
          'error'
        ) as "error_type",
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
