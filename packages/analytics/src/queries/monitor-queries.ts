import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db, schema } from "./client";
import { combineConditions, getFailedSpendLogsCondition } from "./helpers";

const { spendLogs, errorLogs } = schema;

export async function getErrorsSince(since: Date, limit = 100) {
  const whereClause = combineConditions([
    gt(spendLogs.startTime, since),
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
      .orderBy(sql`${spendLogs.startTime} DESC`)
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
      .orderBy(sql`${spendLogs.startTime} DESC`)
      .limit(limit);
  }
}

export async function getErrorCountByModelSince(since: Date) {
  const whereClause = and(
    gt(spendLogs.startTime, since),
    getFailedSpendLogsCondition(),
  );

  return db
    .select({
      model: spendLogs.model,
      error_count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(sql`COUNT(*) DESC`);
}

export async function getModelHealthSince(params: {
  model: string;
  since: Date;
  baselineHours: number;
}) {
  const { model, since } = params;
  const modelCondition = eq(spendLogs.model, model);
  const timeCondition = gt(spendLogs.startTime, since);

  const result = await db
    .select({
      total_requests: sql<number>`COUNT(*)`.mapWith(Number),
      success_count:
        sql<number>`SUM(CASE WHEN ${spendLogs.status} = 'success' THEN 1 ELSE 0 END)`.mapWith(
          Number,
        ),
      error_count:
        sql<number>`SUM(CASE WHEN ${spendLogs.status} != 'success' THEN 1 ELSE 0 END)`.mapWith(
          Number,
        ),
      avg_latency_ms:
        sql<number>`AVG(EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
          Number,
        ),
      last_success_at: sql<
        string | null
      >`MAX(CASE WHEN ${spendLogs.status} = 'success' THEN ${spendLogs.startTime}::text ELSE NULL END)`,
      last_error_at: sql<
        string | null
      >`MAX(CASE WHEN ${spendLogs.status} != 'success' THEN ${spendLogs.startTime}::text ELSE NULL END)`,
      p95_latency_ms: sql<
        number | null
      >`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
        Number,
      ),
    })
    .from(spendLogs)
    .where(
      and(modelCondition, timeCondition, sql`${spendLogs.endTime} IS NOT NULL`),
    )
    .groupBy(spendLogs.model);

  return result;
}

export async function getStuckRequests(since: Date) {
  return db
    .select({
      request_id: spendLogs.requestId,
      model: spendLogs.model,
      startTime: spendLogs.startTime,
    })
    .from(spendLogs)
    .where(and(gt(spendLogs.startTime, since), isNull(spendLogs.endTime)))
    .orderBy(sql`${spendLogs.startTime} ASC`);
}
