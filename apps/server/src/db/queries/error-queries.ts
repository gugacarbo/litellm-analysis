import { desc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { errorLogs, spendLogs } from "../schema";
import {
  combineConditions,
  getFailedSpendLogsCondition,
  getSpendLogsTimeCondition,
  normalizeDays,
} from "./spend-queries";

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
          sql<string>`COALESCE(${errorLogs.exceptionString}, 'Request failed')`.mapWith(
            String,
          ),
        timestamp: spendLogs.startTime,
        status_code:
          sql<number>`COALESCE(${errorLogs.statusCode}, 500)`.mapWith(Number),
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
        error_message: sql<string>`'Request failed'`.mapWith(String),
        timestamp: spendLogs.startTime,
        status_code: sql<number>`500`.mapWith(Number),
      })
      .from(spendLogs)
      .where(whereClause)
      .orderBy(desc(spendLogs.startTime))
      .limit(limit);
  }
}
