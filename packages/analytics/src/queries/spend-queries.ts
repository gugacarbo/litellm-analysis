import { prisma } from "./client";
import { buildWhereClause, getTimeFilterWhere, normalizeDays } from "./helpers";

const TTFT_SQL = `CASE
  WHEN COALESCE(
    to_jsonb("LiteLLM_SpendLogs") ->> 'completionStartTime',
    to_jsonb("LiteLLM_SpendLogs") ->> 'completion_start_time'
  ) IS NULL THEN NULL
  WHEN COALESCE(
    to_jsonb("LiteLLM_SpendLogs") ->> 'completionStartTime',
    to_jsonb("LiteLLM_SpendLogs") ->> 'completion_start_time'
  ) !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN NULL
  ELSE
    EXTRACT(
      EPOCH
      FROM ((
        COALESCE(
          to_jsonb("LiteLLM_SpendLogs") ->> 'completionStartTime',
          to_jsonb("LiteLLM_SpendLogs") ->> 'completion_start_time'
        )
      )::timestamptz - "startTime")
    ) * 1000
END`;

export async function getSpendByModel(days = 30) {
  const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))]);

  const result = await prisma.$queryRawUnsafe<
    Array<{ model: string; total_spend: number }>
  >(`
    SELECT "model", SUM("spend")::float as "total_spend"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "model"
    ORDER BY SUM("spend") DESC
    LIMIT 20
  `);

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
  const conditions: string[] = [];

  if (params.model) {
    conditions.push(`"model" = '${params.model}'`);
  }
  if (params.user) {
    conditions.push(`"user" = '${params.user}'`);
  }
  if (params.startDate) {
    conditions.push(`"startTime" >= '${params.startDate}'::timestamp`);
  }
  if (params.endDate) {
    conditions.push(`"startTime" <= '${params.endDate}'::timestamp`);
  }

  const effectiveLimit = params.limit === 0 ? 1000 : (params.limit ?? 50);
  const offset = params.offset || 0;

  const where = buildWhereClause(conditions);

  const result = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      "request_id",
      "model",
      "user",
      "total_tokens",
      "prompt_tokens",
      "completion_tokens",
      "spend",
      ${TTFT_SQL} as "time_to_first_token_ms",
      "startTime",
      "endTime",
      "api_key",
      "status",
      "call_type",
      "api_base",
      "cache_hit",
      "metadata",
      "proxy_server_request",
      "response",
      "request_tags",
      "model_group",
      "custom_llm_provider",
      "messages"
    FROM "LiteLLM_SpendLogs"
    ${where}
    ORDER BY "startTime" DESC
    LIMIT ${effectiveLimit}
    OFFSET ${offset}
  `);

  return result;
}

export async function getSpendLogsCount(params: {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
}): Promise<number> {
  const conditions: string[] = [];

  if (params.model) {
    conditions.push(`"model" = '${params.model}'`);
  }
  if (params.user) {
    conditions.push(`"user" = '${params.user}'`);
  }
  if (params.startDate) {
    conditions.push(`"startTime" >= '${params.startDate}'::timestamp`);
  }
  if (params.endDate) {
    conditions.push(`"startTime" <= '${params.endDate}'::timestamp`);
  }

  const where = buildWhereClause(conditions);

  const result = await prisma.$queryRawUnsafe<Array<{ count: number }>>(`
    SELECT COUNT(*)::float as "count"
    FROM "LiteLLM_SpendLogs"
    ${where}
  `);

  return result[0]?.count || 0;
}

export async function getSpendByUser(days = 30) {
  const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))]);

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

export async function getSpendByKey(days = 30) {
  const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))]);

  const result = await prisma.$queryRawUnsafe<
    Array<{
      key: string;
      total_spend: number;
      total_tokens: number;
    }>
  >(`
    SELECT
      "api_key" as "key",
      SUM("spend")::float as "total_spend",
      SUM("total_tokens")::float as "total_tokens"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY "api_key"
    ORDER BY SUM("spend") DESC
    LIMIT 20
  `);

  return result;
}

export async function getSpendLogById(requestId: string) {
  const result = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      "request_id",
      "model",
      "call_type",
      "api_base",
      "user",
      "team_id",
      "end_user",
      "organization_id",
      "total_tokens",
      "prompt_tokens",
      "completion_tokens",
      "spend",
      ${TTFT_SQL} as "time_to_first_token_ms",
      "startTime" as "start_time",
      "endTime" as "end_time",
      "completionStartTime" as "completion_start_time",
      "request_duration_ms",
      "api_key",
      "status",
      "cache_hit",
      "cache_key",
      "metadata",
      "proxy_server_request",
      "response",
      "request_tags",
      "requester_ip_address",
      "session_id",
      "agent_id",
      "model_id",
      "model_group",
      "custom_llm_provider",
      "mcp_namespaced_tool_name",
      "messages"
    FROM "LiteLLM_SpendLogs"
    WHERE "request_id" = '${requestId}'
    LIMIT 1
  `);

  return result[0];
}
