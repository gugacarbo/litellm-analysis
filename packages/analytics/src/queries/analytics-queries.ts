import { desc, sql } from "drizzle-orm";
import { db, schema } from "./client";
import {
  combineConditions,
  getFailedSpendLogsCondition,
  getSpendLogsTimeCondition,
  normalizeDays,
} from "./helpers";

const { spendLogs } = schema;

export async function getMetricsSummary(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const spendLogsTimeCondition = getSpendLogsTimeCondition(normalizedDays);

  const [spendSummary, errorSummary] = await Promise.all([
    db
      .select({
        totalSpend: sql<number>`COALESCE(SUM(${spendLogs.spend}), 0)`.mapWith(
          Number,
        ),
        totalTokens:
          sql<number>`COALESCE(SUM(${spendLogs.totalTokens}), 0)`.mapWith(
            Number,
          ),
        activeModels: sql<number>`COUNT(DISTINCT ${spendLogs.model})`.mapWith(
          Number,
        ),
      })
      .from(spendLogs)
      .where(spendLogsTimeCondition),
    db
      .select({
        errorCount: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(spendLogs)
      .where(
        combineConditions([
          spendLogsTimeCondition,
          getFailedSpendLogsCondition(),
        ]),
      ),
  ]);

  const summary = spendSummary[0];
  const errors = errorSummary[0];

  return {
    totalSpend: Number(summary?.totalSpend ?? 0),
    totalTokens: Number(summary?.totalTokens ?? 0),
    activeModels: Number(summary?.activeModels ?? 0),
    errorCount: Number(errors?.errorCount ?? 0),
  };
}

export async function getPerformanceMetrics(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const whereClause = combineConditions([
    getSpendLogsTimeCondition(normalizedDays),
    sql`${spendLogs.endTime} IS NOT NULL`,
    sql`EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) >= 0.1`,
  ]);

  const result = await db
    .select({
      total_requests: sql<number>`COUNT(*)`.mapWith(Number),
      avg_duration_ms:
        sql`AVG(EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
          Number,
        ),
      success_rate: sql`SUM(CASE WHEN ${spendLogs.status} = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100`,
    })
    .from(spendLogs)
    .where(whereClause);
  return (
    result[0] || { total_requests: 0, avg_duration_ms: 0, success_rate: 0 }
  );
}

export async function getCostEfficiencyByModel(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      model: spendLogs.model,
      total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql<number>`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      cost_per_1k_tokens: sql`CASE WHEN SUM(${spendLogs.totalTokens}) > 0 THEN SUM(${spendLogs.spend}) / SUM(${spendLogs.totalTokens}) * 1000 ELSE 0 END`,
      request_count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
}
