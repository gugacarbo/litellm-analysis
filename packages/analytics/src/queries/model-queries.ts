import { randomUUID } from "node:crypto";
import { prisma } from "./client";
import {
  combineSqlConditions,
  getTimeFilterWhere,
  normalizeDays,
} from "./helpers";

export async function getModelDetails() {
  const result = await prisma.$queryRawUnsafe<
    Array<{
      model_name: string;
      input_cost_per_token: string | null;
      output_cost_per_token: string | null;
    }>
  >(`
    SELECT
      "model_name",
      "litellm_params"->>'input_cost_per_token' as "input_cost_per_token",
      "litellm_params"->>'output_cost_per_token' as "output_cost_per_token"
    FROM "LiteLLM_ProxyModelTable"
  `);
  return result;
}

export async function getModelStatistics(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    getTimeFilterWhere(normalizedDays),
    `"endTime" IS NOT NULL`,
    `EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= 0.1`,
  ])}`;

  const result = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      "model",
      COUNT(*)::float as "request_count",
      SUM("spend")::float as "total_spend",
      SUM("total_tokens")::float as "total_tokens",
      SUM("prompt_tokens")::float as "prompt_tokens",
      SUM("completion_tokens")::float as "completion_tokens",
      AVG("total_tokens")::float as "avg_tokens_per_request",
      AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "avg_latency_ms",
      (SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100)::float as "success_rate",
      SUM(CASE WHEN "status" != 'success' THEN 1 ELSE 0 END)::float as "error_count",
      AVG(CASE WHEN "prompt_tokens" > 0 THEN "spend" * "prompt_tokens"::float / NULLIF("total_tokens", 0) ELSE 0 END)::float as "avg_input_cost",
      AVG(CASE WHEN "completion_tokens" > 0 THEN "spend" * "completion_tokens"::float / NULLIF("total_tokens", 0) ELSE 0 END)::float as "avg_output_cost",
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p50_latency_ms",
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p95_latency_ms",
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p99_latency_ms",
      MIN("startTime") as "first_seen",
      MAX("startTime") as "last_seen",
      COUNT(DISTINCT "user")::float as "unique_users",
      COUNT(DISTINCT "api_key")::float as "unique_api_keys",
      AVG(CASE WHEN EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= 0.5 THEN "completion_tokens"::float / EXTRACT(EPOCH FROM ("endTime" - "startTime")) ELSE NULL END)::float as "avg_tokens_per_second",
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CASE WHEN EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= 0.5 THEN "completion_tokens"::float / EXTRACT(EPOCH FROM ("endTime" - "startTime")) ELSE NULL END)::float as "p50_tokens_per_second",
      MAX(CASE WHEN EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= 0.5 THEN "completion_tokens"::float / EXTRACT(EPOCH FROM ("endTime" - "startTime")) ELSE NULL END)::float as "max_tokens_per_second"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "model"
    ORDER BY SUM("spend") DESC
    LIMIT 50
  `);
  return result;
}

export async function getAllModels() {
  const result = await prisma.$queryRawUnsafe<
    Array<{
      modelName: string;
      litellmParams: unknown;
    }>
  >(`
    SELECT "model_name" as "modelName", "litellm_params" as "litellmParams"
    FROM "LiteLLM_ProxyModelTable"
    ORDER BY "model_name" ASC
  `);
  return result;
}

export async function createModel(model: {
  modelName: string;
  litellmParams: Record<string, unknown>;
}) {
  const modelId = randomUUID();
  const actor = "lite-llm-analytics";
  const modelInfo = JSON.stringify({ id: modelId, db_model: true });
  const litellmParamsJson = JSON.stringify(model.litellmParams);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "LiteLLM_ProxyModelTable" (
      model_id, model_name, litellm_params, model_info,
      created_by, updated_by
    )
    VALUES (
      '${modelId}',
      '${model.modelName}',
      '${litellmParamsJson}'::jsonb,
      '${modelInfo}'::jsonb,
      '${actor}',
      '${actor}'
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
  const setClauses: string[] = [];
  if (updates.litellmParams !== undefined) {
    setClauses.push(
      `"litellm_params" = '${JSON.stringify(updates.litellmParams)}'::jsonb`,
    );
  }
  if (updates.modelName !== undefined) {
    setClauses.push(`"model_name" = '${updates.modelName}'`);
  }

  if (setClauses.length === 0) return;

  await prisma.$executeRawUnsafe(`
    UPDATE "LiteLLM_ProxyModelTable"
    SET ${setClauses.join(", ")}
    WHERE "model_name" = '${modelName}'
  `);
}

export async function deleteModel(modelName: string) {
  await prisma.$executeRawUnsafe(`
    DELETE FROM "LiteLLM_ProxyModelTable"
    WHERE "model_name" = '${modelName}'
  `);
}

export async function mergeModels(sourceModel: string, targetModel: string) {
  await prisma.$executeRawUnsafe(`
    UPDATE "LiteLLM_SpendLogs"
    SET "model" = '${targetModel}'
    WHERE "model" = '${sourceModel}'
  `);
}

export async function deleteModelLogs(modelName: string) {
  if (modelName.trim() === "") {
    await prisma.$executeRawUnsafe(`
      DELETE FROM "LiteLLM_SpendLogs"
      WHERE NULLIF(BTRIM("model"), '') IS NULL
    `);
    return;
  }

  await prisma.$executeRawUnsafe(`
    DELETE FROM "LiteLLM_SpendLogs"
    WHERE "model" = '${modelName}'
  `);
}

export async function getDailySpendTrendByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      spend: number;
      total_tokens: number;
      request_count: number;
    }>
  >(`
    SELECT
      DATE("startTime")::text as "date",
      SUM("spend")::float as "spend",
      SUM("total_tokens")::float as "total_tokens",
      COUNT(*)::float as "request_count"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY DATE("startTime")
    ORDER BY DATE("startTime")
  `);
  return result;
}

export async function getDailyTokenTrendByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    }>
  >(`
    SELECT
      DATE("startTime")::text as "date",
      SUM("prompt_tokens")::float as "prompt_tokens",
      SUM("completion_tokens")::float as "completion_tokens",
      SUM("total_tokens")::float as "total_tokens"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY DATE("startTime")
    ORDER BY DATE("startTime")
  `);
  return result;
}

export async function getHourlyUsageByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 7);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      hour: number;
      request_count: number;
      total_spend: number;
      total_tokens: number;
    }>
  >(`
    SELECT
      EXTRACT(HOUR FROM "startTime")::int as "hour",
      COUNT(*)::float as "request_count",
      SUM("spend")::float as "total_spend",
      SUM("total_tokens")::float as "total_tokens"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY EXTRACT(HOUR FROM "startTime")
    ORDER BY EXTRACT(HOUR FROM "startTime")
  `);
  return result;
}

export async function getDailyLatencyTrendByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    `"endTime" IS NOT NULL`,
    `EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= 0`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      avg_latency_ms: number;
      p50_latency_ms: number;
      p95_latency_ms: number;
      p99_latency_ms: number;
    }>
  >(`
    SELECT
      DATE("startTime")::text as "date",
      AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "avg_latency_ms",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p50_latency_ms",
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p95_latency_ms",
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p99_latency_ms"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY DATE("startTime")
    ORDER BY DATE("startTime")
  `);
  return result;
}

export async function getErrorBreakdownByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    `LOWER(COALESCE("status", '')) != 'success'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      error_type: string;
      count: number;
      last_occurred: Date;
    }>
  >(`
    SELECT
      COALESCE("status", 'error') as "error_type",
      COUNT(*)::float as "count",
      MAX("startTime") as "last_occurred"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY COALESCE("status", 'error')
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `);
  return result;
}

export async function getDailyErrorTrendByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    `LOWER(COALESCE("status", '')) != 'success'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{ date: string; error_count: number }>
  >(`
    SELECT
      DATE("startTime")::text as "date",
      COUNT(*)::float as "error_count"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY DATE("startTime")
    ORDER BY DATE("startTime")
  `);
  return result;
}

export async function getTopUsersByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      user: string;
      total_spend: number;
      total_tokens: number;
      request_count: number;
    }>
  >(`
    SELECT
      "user",
      SUM("spend")::float as "total_spend",
      SUM("total_tokens")::float as "total_tokens",
      COUNT(*)::float as "request_count"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "user"
    ORDER BY SUM("spend") DESC
    LIMIT 20
  `);
  return result;
}

export async function getTopApiKeysByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      api_key: string;
      total_spend: number;
      total_tokens: number;
      request_count: number;
      success_rate: number;
      avg_tokens_per_second: number;
    }>
  >(`
    SELECT
      "api_key",
      SUM("spend")::float as "total_spend",
      SUM("total_tokens")::float as "total_tokens",
      COUNT(*)::float as "request_count",
            (SUM(CASE WHEN "status" = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100)::float as "success_rate",
      AVG(CASE WHEN EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= 0.5 THEN "completion_tokens"::float / EXTRACT(EPOCH FROM ("endTime" - "startTime")) ELSE NULL END)::float as "avg_tokens_per_second"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "api_key"
    ORDER BY SUM("spend") DESC
    LIMIT 20
  `);
  return result;
}

export async function getModelCacheHitRateByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      cache_hits: number;
      total_requests: number;
      cache_hit_rate: number;
    }>
  >(`
    SELECT
      COUNT(*) FILTER (WHERE "cache_hit" = 'true')::float as "cache_hits",
      COUNT(*)::float as "total_requests",
      ROUND(
        COUNT(*) FILTER (WHERE "cache_hit" = 'true') * 100.0
        / NULLIF(COUNT(*), 0),
        2
      )::float as "cache_hit_rate"
    FROM "LiteLLM_SpendLogs"
    ${where}
  `);

  return result[0] || { cache_hits: 0, total_requests: 0, cache_hit_rate: 0 };
}

export async function getModelTTFTPercentilesByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    `"completionStartTime" IS NOT NULL`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      avg_ttft_ms: number;
      p50_ttft_ms: number;
      p95_ttft_ms: number;
      p99_ttft_ms: number;
      min_ttft_ms: number;
      max_ttft_ms: number;
    }>
  >(`
    SELECT
      AVG(EXTRACT(EPOCH FROM ("completionStartTime" - "startTime")) * 1000)::float as "avg_ttft_ms",
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("completionStartTime" - "startTime")) * 1000)::float as "p50_ttft_ms",
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("completionStartTime" - "startTime")) * 1000)::float as "p95_ttft_ms",
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("completionStartTime" - "startTime")) * 1000)::float as "p99_ttft_ms",
      MIN(EXTRACT(EPOCH FROM ("completionStartTime" - "startTime")) * 1000)::float as "min_ttft_ms",
      MAX(EXTRACT(EPOCH FROM ("completionStartTime" - "startTime")) * 1000)::float as "max_ttft_ms"
    FROM "LiteLLM_SpendLogs"
    ${where}
  `);

  return (
    result[0] || {
      avg_ttft_ms: 0,
      p50_ttft_ms: 0,
      p95_ttft_ms: 0,
      p99_ttft_ms: 0,
      min_ttft_ms: 0,
      max_ttft_ms: 0,
    }
  );
}

export async function getModelStatusDistributionByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      status: string;
      count: number;
      percentage: number;
    }>
  >(`
    SELECT
      COALESCE("status", 'pending') as "status",
      COUNT(*)::float as "count",
      ROUND(
        COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0),
        2
      )::float as "percentage"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY COALESCE("status", 'pending')
    ORDER BY COUNT(*) DESC
    LIMIT 20
  `);

  return result;
}

export async function getModelProviderBreakdownByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    `"endTime" IS NOT NULL`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      provider: string;
      request_count: number;
      total_spend: number;
      avg_latency_ms: number;
    }>
  >(`
    SELECT
      COALESCE("custom_llm_provider", 'unknown') as "provider",
      COUNT(*)::float as "request_count",
      SUM("spend")::float as "total_spend",
      AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "avg_latency_ms"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY COALESCE("custom_llm_provider", 'unknown')
    ORDER BY SUM("spend") DESC
  `);

  return result;
}
