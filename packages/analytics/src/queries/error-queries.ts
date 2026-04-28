import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "./client";
import {
  combineConditions,
  getFailedSpendLogsCondition,
  getSpendLogsTimeCondition,
  normalizeDays,
} from "./helpers";

const { spendLogs, errorLogs } = schema;

export async function getErrorLogs(limit = 50, days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const whereClause = combineConditions([
    getSpendLogsTimeCondition(normalizedDays),
    getFailedSpendLogsCondition(),
  ]);

  try {
    return await db
      .select({
        id: spendLogs.requestId,
        error_type:
          sql<string>`COALESCE(${errorLogs.exceptionType}, ${spendLogs.status}, 'error')`.mapWith(
            String,
          ),
        model: spendLogs.model,
        user: spendLogs.user,
        error_message:
          sql<string>`COALESCE(NULLIF(BTRIM(${errorLogs.exceptionString}), ''), ${spendLogs.status}, 'Request failed')`.mapWith(
            String,
          ),
        timestamp: spendLogs.startTime,
        status_code:
          sql<number>`COALESCE(${errorLogs.statusCode}, 500)`.mapWith(Number),
        litellm_model_name: errorLogs.litellmModelName,
        request_kwargs: errorLogs.requestKwargs,
        api_key: spendLogs.apiKey,
        spend_status: spendLogs.status,
        total_tokens: spendLogs.totalTokens,
        prompt_tokens: spendLogs.promptTokens,
        completion_tokens: spendLogs.completionTokens,
        spend: spendLogs.spend,
        end_time: spendLogs.endTime,
      })
      .from(spendLogs)
      .leftJoin(errorLogs, eq(errorLogs.requestId, spendLogs.requestId))
      .where(whereClause)
      .orderBy(desc(spendLogs.startTime))
      .limit(limit);
  } catch {
    return db
      .select({
        id: spendLogs.requestId,
        error_type:
          sql<string>`COALESCE(NULLIF(BTRIM(${spendLogs.status}), ''), 'error')`.mapWith(
            String,
          ),
        model: spendLogs.model,
        user: spendLogs.user,
        error_message:
          sql<string>`COALESCE(NULLIF(BTRIM(${spendLogs.status}), ''), 'Request failed')`.mapWith(
            String,
          ),
        timestamp: spendLogs.startTime,
        status_code: sql<number>`500`.mapWith(Number),
        litellm_model_name: sql<string>`null`.mapWith(String),
        request_kwargs: sql<string>`null`.mapWith(String),
        api_key: spendLogs.apiKey,
        spend_status:
          sql<string>`COALESCE(NULLIF(BTRIM(${spendLogs.status}), ''), 'error')`.mapWith(
            String,
          ),
        total_tokens: spendLogs.totalTokens,
        prompt_tokens: spendLogs.promptTokens,
        completion_tokens: spendLogs.completionTokens,
        spend: spendLogs.spend,
        end_time: spendLogs.endTime,
      })
      .from(spendLogs)
      .where(whereClause)
      .orderBy(desc(spendLogs.startTime))
      .limit(limit);
  }
}
