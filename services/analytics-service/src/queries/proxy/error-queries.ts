import { getModelProxyPrisma } from "./client";
import {
  buildProxyWhereClause,
  getProxyErrorFilter,
  getProxyTimeFilterWhere,
  normalizeProxyDays,
  PROXY_REQUESTS_TABLE,
  PROXY_TIME_COLUMN,
} from "./helpers";

export async function getErrorLogs(limit = 50, days = 30) {
  const normalizedDays = normalizeProxyDays(days, 30);
  const where = buildProxyWhereClause([
    getProxyTimeFilterWhere(normalizedDays),
    getProxyErrorFilter(),
  ]);
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
