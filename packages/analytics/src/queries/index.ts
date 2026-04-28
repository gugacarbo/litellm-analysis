import { randomUUID } from "node:crypto";
import { sortAliasesByDefinitionOrder } from "@lite-llm/alias-router";
import { and, asc, desc, eq, gte, type SQL, sql } from "drizzle-orm";
import { db, schema } from "./client";

const { spendLogs, proxyModelTable, errorLogs } = schema;

function normalizeDays(days: number | string | undefined, fallback: number) {
  const parsed = typeof days === "string" ? Number.parseInt(days, 10) : days;
  if (typeof parsed !== "number" || Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function getWindowStart(days: number): Date | null {
  if (days <= 0) {
    return null;
  }

  const now = new Date();

  if (days === 1) {
    now.setHours(0, 0, 0, 0);
    return now;
  }

  now.setDate(now.getDate() - days);
  return now;
}

function getSpendLogsTimeCondition(days: number): SQL | undefined {
  const windowStart = getWindowStart(days);
  return windowStart ? gte(spendLogs.startTime, windowStart) : undefined;
}

function getFailedSpendLogsCondition(): SQL {
  return sql`LOWER(COALESCE(${spendLogs.status}, '')) != 'success'`;
}

function combineConditions(
  conditions: Array<SQL | undefined>,
): SQL | undefined {
  const validConditions = conditions.filter(
    (condition): condition is SQL => condition !== undefined,
  );

  if (validConditions.length === 0) {
    return undefined;
  }

  if (validConditions.length === 1) {
    return validConditions[0];
  }

  return and(...validConditions);
}

export async function getSpendByModel(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));

  const result = await db
    .select({
      model: spendLogs.model,
      total_spend: sql<number>`SUM(${spendLogs.spend})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
}

export async function getSpendLogs(params: {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions: SQL[] = [];

  if (params.model) {
    conditions.push(eq(spendLogs.model, params.model));
  }
  if (params.user) {
    conditions.push(eq(spendLogs.user, params.user));
  }
  if (params.startDate) {
    conditions.push(
      gte(spendLogs.startTime, sql`${params.startDate}::timestamp`),
    );
  }
  if (params.endDate) {
    conditions.push(
      sql`${spendLogs.startTime} <= ${params.endDate}::timestamp`,
    );
  }

  const limit = params.limit || 50;
  const offset = params.offset || 0;

  const whereClause = combineConditions(conditions);
  const completionStartTime = sql<string | null>`COALESCE(
    to_jsonb(${spendLogs}) ->> 'completionStartTime',
    to_jsonb(${spendLogs}) ->> 'completion_start_time'
  )`;

  const result = await db
    .select({
      request_id: spendLogs.requestId,
      model: spendLogs.model,
      user: spendLogs.user,
      total_tokens: spendLogs.totalTokens,
      prompt_tokens: spendLogs.promptTokens,
      completion_tokens: spendLogs.completionTokens,
      spend: sql`${spendLogs.spend}`.mapWith(Number),
      time_to_first_token_ms: sql<number | null>`CASE
        WHEN ${completionStartTime} IS NULL THEN NULL
        WHEN ${completionStartTime} !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN NULL
        ELSE
          EXTRACT(
            EPOCH
            FROM ((${completionStartTime})::timestamptz - ${spendLogs.startTime})
          ) * 1000
      END`,
      startTime: spendLogs.startTime,
      endTime: spendLogs.endTime,
      api_key: spendLogs.apiKey,
      status: spendLogs.status,
    })
    .from(spendLogs)
    .where(whereClause)
    .orderBy(desc(spendLogs.startTime))
    .limit(limit)
    .offset(offset);
  return result;
}

export async function getSpendLogsCount(params: {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
}): Promise<number> {
  const conditions: SQL[] = [];

  if (params.model) {
    conditions.push(eq(spendLogs.model, params.model));
  }
  if (params.user) {
    conditions.push(eq(spendLogs.user, params.user));
  }
  if (params.startDate) {
    conditions.push(
      gte(spendLogs.startTime, sql`${params.startDate}::timestamp`),
    );
  }
  if (params.endDate) {
    conditions.push(
      sql`${spendLogs.startTime} <= ${params.endDate}::timestamp`,
    );
  }

  const whereClause = combineConditions(conditions);

  const result = await db
    .select({ count: sql`COUNT(*)`.mapWith(Number) })
    .from(spendLogs)
    .where(whereClause);
  return result[0]?.count || 0;
}

export async function getSpendByUser(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));

  const result = await db
    .select({
      user: spendLogs.user,
      total_spend: sql<number>`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql<number>`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      request_count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.user)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
}

export async function getSpendByKey(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));

  const result = await db
    .select({
      key: spendLogs.apiKey,
      total_spend: sql<number>`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql<number>`SUM(${spendLogs.totalTokens})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.apiKey)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
}

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

export async function getDailySpendTrend(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(asc(sql`DATE(${spendLogs.startTime})`));
  return result;
}

export async function getTokenDistribution(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      model: spendLogs.model,
      prompt_tokens: sql`SUM(${spendLogs.promptTokens})`.mapWith(Number),
      completion_tokens: sql`SUM(${spendLogs.completionTokens})`.mapWith(
        Number,
      ),
      avg_tokens_per_request: sql`AVG(${spendLogs.totalTokens})`.mapWith(
        Number,
      ),
      input_output_ratio: sql`CASE WHEN SUM(${spendLogs.completionTokens}) > 0 THEN SUM(${spendLogs.promptTokens})::float / SUM(${spendLogs.completionTokens}) ELSE 0 END`,
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(
      desc(
        sql`SUM(${spendLogs.promptTokens}) + SUM(${spendLogs.completionTokens})`,
      ),
    )
    .limit(20);
  return result;
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

export async function getHourlyUsagePatterns(days = 7) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 7));
  const result = await db
    .select({
      hour: sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`,
      request_count: sql`COUNT(*)`.mapWith(Number),
      total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`)
    .orderBy(asc(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`));
  return result;
}

export async function getApiKeyDetailedStats(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      key: spendLogs.apiKey,
      request_count: sql`COUNT(*)`.mapWith(Number),
      total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      avg_tokens_per_request: sql`AVG(${spendLogs.totalTokens})`.mapWith(
        Number,
      ),
      success_rate: sql`SUM(CASE WHEN ${spendLogs.status} = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100`,
      last_used: sql`MAX(${spendLogs.startTime})`,
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.apiKey)
    .orderBy(desc(sql`SUM(${spendLogs.spend})`))
    .limit(20);
  return result;
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

export async function getModelRequestDistribution(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const totalResult = await db
    .select({ count: sql`COUNT(*)`.mapWith(Number) })
    .from(spendLogs)
    .where(whereClause);
  const totalCount = totalResult[0]?.count || 1;

  const result = await db
    .select({
      model: spendLogs.model,
      request_count: sql<number>`COUNT(*)`.mapWith(Number),
      percentage: sql`(COUNT(*) * 100.0 / ${totalCount})::numeric(10,2)`,
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(15);
  return result;
}

export async function getDailyTokenTrend(days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
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
    .orderBy(asc(sql`DATE(${spendLogs.startTime})`));
  return result;
}

export async function getTopModelsByRequests(limit = 10, days = 30) {
  const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
  const result = await db
    .select({
      model: spendLogs.model,
      request_count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(spendLogs.model)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);
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
      p50_tokens_per_second:
        sql`PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CASE WHEN EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) >= 0.5 THEN ${spendLogs.completionTokens}::float / EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) ELSE NULL END)`.mapWith(
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
  updates: { litellmParams?: Record<string, unknown>; modelName?: string },
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

export async function getRouterSettings(): Promise<Record<
  string,
  unknown
> | null> {
  const result = await db.execute(
    sql`SELECT param_value FROM "LiteLLM_Config" WHERE param_name = 'router_settings' LIMIT 1`,
  );
  const row = result.rows[0] as { param_value: unknown } | undefined;
  return row?.param_value ? (row.param_value as Record<string, unknown>) : null;
}

export async function updateRouterSettings(
  modelGroupAlias: Record<string, string>,
): Promise<void> {
  const existing = await getRouterSettings();
  const merged: Record<string, unknown> = existing ? { ...existing } : {};
  const existingAliases =
    typeof merged.model_group_alias === "object" &&
    merged.model_group_alias !== null
      ? ({ ...merged.model_group_alias } as Record<string, string>)
      : {};

  for (const [key, value] of Object.entries(modelGroupAlias)) {
    if (value === "") {
      delete existingAliases[key];
    } else {
      existingAliases[key] = value;
    }
  }
  merged.model_group_alias = sortAliasesByDefinitionOrder(existingAliases);

  await db.execute(
    sql`INSERT INTO "LiteLLM_Config" (param_name, param_value) VALUES ('router_settings', ${JSON.stringify(merged)})
			ON CONFLICT (param_name) DO UPDATE SET param_value = EXCLUDED.param_value`,
  );
}

export async function getDailySpendTrendByModel(
  modelName: string,
  days = 30,
) {
  const whereClause = combineConditions([
    getSpendLogsTimeCondition(normalizeDays(days, 30)),
    eq(spendLogs.model, modelName),
  ]);
  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
      request_count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(asc(sql`DATE(${spendLogs.startTime})`));
  return result;
}

export async function getDailyTokenTrendByModel(
  modelName: string,
  days = 30,
) {
  const whereClause = combineConditions([
    getSpendLogsTimeCondition(normalizeDays(days, 30)),
    eq(spendLogs.model, modelName),
  ]);
  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      prompt_tokens: sql`SUM(${spendLogs.promptTokens})`.mapWith(Number),
      completion_tokens:
        sql`SUM(${spendLogs.completionTokens})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(asc(sql`DATE(${spendLogs.startTime})`));
  return result;
}

export async function getHourlyUsageByModel(modelName: string, days = 7) {
  const whereClause = combineConditions([
    getSpendLogsTimeCondition(normalizeDays(days, 7)),
    eq(spendLogs.model, modelName),
  ]);
  const result = await db
    .select({
      hour: sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`,
      request_count: sql`COUNT(*)`.mapWith(Number),
      total_spend: sql`SUM(${spendLogs.spend})`.mapWith(Number),
      total_tokens: sql`SUM(${spendLogs.totalTokens})`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`)
    .orderBy(asc(sql`EXTRACT(HOUR FROM ${spendLogs.startTime})`));
  return result;
}

export async function getDailyLatencyTrendByModel(
  modelName: string,
  days = 30,
) {
  const whereClause = combineConditions([
    getSpendLogsTimeCondition(normalizeDays(days, 30)),
    eq(spendLogs.model, modelName),
    sql`${spendLogs.endTime} IS NOT NULL`,
    sql`EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) >= 0.1`,
  ]);
  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      avg_latency_ms:
        sql`AVG(EXTRACT(EPOCH FROM (${spendLogs.endTime} - ${spendLogs.startTime})) * 1000)`.mapWith(
          Number,
        ),
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
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(asc(sql`DATE(${spendLogs.startTime})`));
  return result;
}

export async function getErrorBreakdownByModel(
  modelName: string,
  days = 30,
) {
  const whereClause = combineConditions([
    getSpendLogsTimeCondition(normalizeDays(days, 30)),
    eq(spendLogs.model, modelName),
    getFailedSpendLogsCondition(),
  ]);
  const result = await db
    .select({
      error_type:
        sql<string>`COALESCE(${errorLogs.exceptionType}, ${spendLogs.status}, 'error')`.mapWith(
          String,
        ),
      count: sql<number>`COUNT(*)`.mapWith(Number),
      last_occurred: sql<string>`MAX(${spendLogs.startTime})`.mapWith(
        String,
      ),
    })
    .from(spendLogs)
    .leftJoin(errorLogs, eq(errorLogs.requestId, spendLogs.requestId))
    .where(whereClause)
    .groupBy(
      sql`COALESCE(${errorLogs.exceptionType}, ${spendLogs.status}, 'error')`,
    )
    .orderBy(desc(sql`COUNT(*)`))
    .limit(20);
  return result;
}

export async function getDailyErrorTrendByModel(
  modelName: string,
  days = 30,
) {
  const whereClause = combineConditions([
    getSpendLogsTimeCondition(normalizeDays(days, 30)),
    eq(spendLogs.model, modelName),
    getFailedSpendLogsCondition(),
  ]);
  const result = await db
    .select({
      date: sql`DATE(${spendLogs.startTime})`,
      error_count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(spendLogs)
    .where(whereClause)
    .groupBy(sql`DATE(${spendLogs.startTime})`)
    .orderBy(asc(sql`DATE(${spendLogs.startTime})`));
  return result;
}

export const modelMerges: Record<string, string> = {};
