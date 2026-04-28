import { randomUUID } from "node:crypto";
import { asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { db, schema } from "./client";
import {
  combineConditions,
  getSpendLogsTimeCondition,
  normalizeDays,
} from "./helpers";

const { spendLogs, proxyModelTable } = schema;

export async function getModelDetails() {
  const result = await db
    .select({
      model_name: proxyModelTable.modelName,
      input_cost_per_token: sql`${proxyModelTable.litellmParams}->>'input_cost_per_token'`,
      output_cost_per_token: sql`${proxyModelTable.litellmParams}->>'output_cost_per_token'`,
    })
    .from(proxyModelTable);
  return result;
}

export async function getModelStatistics(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const whereClause = combineConditions([
    getSpendLogsTimeCondition(normalizedDays),
    sql`${spendLogs.endTime} IS NOT NULL`,
    sql`EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) >= 0.1`,
  ]);

  const result = await db
    .select({
      model: spendLogs.model,
      request_count: sql<number>`COUNT(*)`.mapWith(Number),
      total_spend: sql<number>`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql<number>`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      prompt_tokens: sql<number>`SUM(${spendLogs.promptTokens})`.mapWith(
        Number,
      ),
      completion_tokens:
        sql<number>`SUM(${spendLogs.completionTokens})`.mapWith(Number),
      avg_tokens_per_request: sql`AVG(${spendLogs.totalTokens})`.mapWith(
        Number,
      ),
      avg_latency_ms:
        sql`AVG(EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
          Number,
        ),
      success_rate: sql`SUM(CASE WHEN ${spendLogs.status} = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100`,
      error_count: sql`SUM(CASE WHEN ${spendLogs.status} != 'success' THEN 1 ELSE 0 END)`,
      avg_input_cost: sql`AVG(CASE WHEN ${spendLogs.promptTokens} > 0 THEN ${spendLogs.spend} * ${spendLogs.promptTokens}::float / NULLIF(${spendLogs.totalTokens}, 0) ELSE 0 END)`,
      avg_output_cost: sql`AVG(CASE WHEN ${spendLogs.completionTokens} > 0 THEN ${spendLogs.spend} * ${spendLogs.completionTokens}::float / NULLIF(${spendLogs.totalTokens}, 0) ELSE 0 END)`,
      p50_latency_ms:
        sql`PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
          Number,
        ),
      p95_latency_ms:
        sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
          Number,
        ),
      p99_latency_ms:
        sql`PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
          Number,
        ),
      first_seen: sql`MIN(${spendLogs.startTime})`,
      last_seen: sql`MAX(${spendLogs.startTime})`,
      unique_users: sql`COUNT(DISTINCT ${spendLogs.user})`.mapWith(Number),
      unique_api_keys: sql`COUNT(DISTINCT ${spendLogs.apiKey})`.mapWith(Number),
      avg_tokens_per_second:
        sql`AVG(CASE WHEN EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) >= 0.5 THEN ${spendLogs.completionTokens}::float / EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) ELSE NULL END)`.mapWith(
          Number,
        ),
      p50_tokens_per_second:
        sql`PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CASE WHEN EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) >= 0.5 THEN ${spendLogs.completionTokens}::float / EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) ELSE NULL END)`.mapWith(
          Number,
        ),
      max_tokens_per_second:
        sql`MAX(CASE WHEN EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) >= 0.5 THEN ${spendLogs.completionTokens}::float / EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) ELSE NULL END)`.mapWith(
          Number,
        ),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(50);
  return result;
}

export async function getAllModels() {
  const result = await db
    .select({
      modelName: proxyModelTable.modelName,
      litellmParams: proxyModelTable.litellmParams,
    })
    .from(proxyModelTable)
    .orderBy(asc(proxyModelTable.modelName));
  return result;
}

export async function getModelByName(modelName: string) {
  const result = await db
    .select({
      modelName: proxyModelTable.modelName,
      litellmParams: proxyModelTable.litellmParams,
    })
    .from(proxyModelTable)
    .where(eq(proxyModelTable.modelName, modelName))
    .limit(1);
  return result[0] || null;
}

export async function createModel(model: {
  modelName: string;
  litellmParams: Record<string, unknown>;
}) {
  const modelId = randomUUID();
  const actor = "lite-llm-analytics";
  const modelInfo = { id: modelId, db_model: true };

  await db.execute(sql`
    INSERT INTO "LiteLLM_ProxyModelTable" (
      model_id,
      model_name,
      litellm_params,
      model_info,
      created_by,
      updated_by
    )
    VALUES (
      ${modelId},
      ${model.modelName},
      ${JSON.stringify(model.litellmParams)}::jsonb,
      ${JSON.stringify(modelInfo)}::jsonb,
      ${actor},
      ${actor}
    )
  `);
}

export async function updateModel(
  modelName: string,
  updates: {
    litellmParams?: Record<string, unknown>;
    modelName?: string;
  },
) {
  await db
    .update(proxyModelTable)
    .set(updates)
    .where(eq(proxyModelTable.modelName, modelName));
}

export async function deleteModel(modelName: string) {
  await db
    .delete(proxyModelTable)
    .where(eq(proxyModelTable.modelName, modelName));
}

export async function mergeModels(sourceModel: string, targetModel: string) {
  await db
    .update(spendLogs)
    .set({ model: targetModel })
    .where(eq(spendLogs.model, sourceModel));
}

export async function deleteModelLogs(modelName: string) {
  if (modelName.trim() === "") {
    await db
      .delete(spendLogs)
      .where(sql`NULLIF(BTRIM(${spendLogs.model}), '') IS NULL`);
    return;
  }

  await db.delete(spendLogs).where(eq(spendLogs.model, modelName));
}

export const modelMerges: Record<string, string> = {};

export async function getDailySpendTrendByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const conditions: Array<SQL | undefined> = [eq(spendLogs.model, model)];
  const timeCondition = getSpendLogsTimeCondition(normalizedDays);
  if (timeCondition) {
    conditions.push(timeCondition);
  }
  const whereClause = combineConditions(conditions);

  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      request_count: sql`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(sql`DATE(${spendLogs.startTime})`);
  return result;
}

export async function getDailyTokenTrendByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const conditions: Array<SQL | undefined> = [eq(spendLogs.model, model)];
  const timeCondition = getSpendLogsTimeCondition(normalizedDays);
  if (timeCondition) {
    conditions.push(timeCondition);
  }
  const whereClause = combineConditions(conditions);

  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      prompt_tokens: sql`SUM(${spendLogs.promptTokens})`.mapWith(Number),
      completion_tokens: sql`SUM(${spendLogs.completionTokens})`.mapWith(
        Number,
      ),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(sql`DATE(${spendLogs.startTime})`);
  return result;
}

export async function getHourlyUsageByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 7);
  const conditions: Array<SQL | undefined> = [eq(spendLogs.model, model)];
  const timeCondition = getSpendLogsTimeCondition(normalizedDays);
  if (timeCondition) {
    conditions.push(timeCondition);
  }
  const whereClause = combineConditions(conditions);

  const result = await db
    .select({
      hour: sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`.mapWith(Number),
      request_count: sql`COUNT(*)`.mapWith(Number),
      total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`);
  return result;
}

export async function getDailyLatencyTrendByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const conditions: Array<SQL | undefined> = [
    eq(spendLogs.model, model),
    sql`${spendLogs.endTime} IS NOT NULL`,
    sql`EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) >= 0`,
  ];
  const timeCondition = getSpendLogsTimeCondition(normalizedDays);
  if (timeCondition) {
    conditions.push(timeCondition);
  }
  const whereClause = combineConditions(conditions);

  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      avg_latency_ms: sql`AVG(EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
        Number,
      ),
      p50_latency_ms: sql`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
        Number,
      ),
      p95_latency_ms: sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
        Number,
      ),
      p99_latency_ms: sql`PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
        Number,
      ),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(sql`DATE(${spendLogs.startTime})`);
  return result;
}

export async function getErrorBreakdownByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const conditions: Array<SQL | undefined> = [
    eq(spendLogs.model, model),
    sql`LOWER(COALESCE(${spendLogs.status}, '')) != 'success'`,
  ];
  const timeCondition = getSpendLogsTimeCondition(normalizedDays);
  if (timeCondition) {
    conditions.push(timeCondition);
  }
  const whereClause = combineConditions(conditions);

  const result = await db
    .select({
      error_type: sql<string>`COALESCE(${spendLogs.status}, 'error')`,
      count: sql`COUNT(*)`.mapWith(Number),
      last_occurred: sql`MAX(${spendLogs.startTime})`,
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`COALESCE(${spendLogs.status}, 'error')`)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);
  return result;
}

export async function getDailyErrorTrendByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const conditions: Array<SQL | undefined> = [
    eq(spendLogs.model, model),
    sql`LOWER(COALESCE(${spendLogs.status}, '')) != 'success'`,
  ];
  const timeCondition = getSpendLogsTimeCondition(normalizedDays);
  if (timeCondition) {
    conditions.push(timeCondition);
  }
  const whereClause = combineConditions(conditions);

  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      error_count: sql`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(sql`DATE(${spendLogs.startTime})`);
  return result;
}

export async function getTopUsersByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const conditions: Array<SQL | undefined> = [eq(spendLogs.model, model)];
  const timeCondition = getSpendLogsTimeCondition(normalizedDays);
  if (timeCondition) {
    conditions.push(timeCondition);
  }
  const whereClause = combineConditions(conditions);

  const result = await db
    .select({
      user: spendLogs.user,
      total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      request_count: sql`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.user)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
}

export async function getTopApiKeysByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const conditions: Array<SQL | undefined> = [eq(spendLogs.model, model)];
  const timeCondition = getSpendLogsTimeCondition(normalizedDays);
  if (timeCondition) {
    conditions.push(timeCondition);
  }
  const whereClause = combineConditions(conditions);

  const result = await db
    .select({
      api_key: spendLogs.apiKey,
      total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      request_count: sql`COUNT(*)`.mapWith(Number),
      success_rate: sql`SUM(CASE WHEN ${spendLogs.status} = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100`.mapWith(
        Number,
      ),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.apiKey)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
}
