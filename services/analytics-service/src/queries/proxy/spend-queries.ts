import { queryRaw } from "@lite-llm/database/client";
import type {
  ModelProxyMessage,
  ModelProxyUsageAdjustment,
} from "@lite-llm/database/schema/model-proxy";
import { sql } from "drizzle-orm";
import {
  adjustedTotalCostSql,
  adjustedTotalTokensSql,
  buildProxyWhereClause,
  PROXY_REQUESTS_TABLE,
  proxyAdjustmentsJoin,
} from "./helpers";

export interface ProxySpendLogsQueryParams {
  model?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

function buildWhereConditions(
  params: Pick<ProxySpendLogsQueryParams, "model" | "startDate" | "endDate">,
): string[] {
  const conditions: string[] = [];

  if (params.model) {
    conditions.push(`r."model" = '${params.model.replace(/'/g, "''")}'`);
  }

  if (params.startDate) {
    conditions.push(`r."started_at" >= '${params.startDate}'`);
  }

  if (params.endDate) {
    conditions.push(`r."started_at" <= '${params.endDate}'`);
  }

  return conditions;
}

export async function getSpendLogs(params: ProxySpendLogsQueryParams) {
  const effectiveLimit = params.limit === 0 ? 1000 : (params.limit ?? 50);
  const offset = params.offset ?? 0;

  const conditions = buildWhereConditions(params);
  const whereClause = buildProxyWhereClause(conditions);

  const rows = await queryRaw<Record<string, unknown>>(
    sql.raw(`
      SELECT r.*
      FROM "${PROXY_REQUESTS_TABLE}" r
      ${whereClause}
      ORDER BY r."started_at" DESC
      LIMIT ${effectiveLimit} OFFSET ${offset}
    `),
    [],
  );

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id as string).filter(Boolean);
  if (ids.length === 0) return rows;

  const idList = buildIdList(ids);

  const [messages, adjustments] = await Promise.all([
    queryRaw<ModelProxyMessage>(
      sql.raw(
        `SELECT * FROM "model_proxy_messages" WHERE "request_id" IN (${idList}) ORDER BY "created_at" ASC`,
      ),
      [],
    ),
    queryRaw<ModelProxyUsageAdjustment>(
      sql.raw(
        `SELECT * FROM "model_proxy_usage_adjustments" WHERE "request_id" IN (${idList}) ORDER BY "created_at" ASC`,
      ),
      [],
    ),
  ]);

  const messagesByRequest = groupByRequestId(messages, "requestId");
  const adjustmentsByRequest = groupByRequestId(adjustments, "requestId");

  return rows.map((row) => ({
    ...row,
    messages: messagesByRequest.get(row.id as string) ?? [],
    usageAdjustments: adjustmentsByRequest.get(row.id as string) ?? [],
  }));
}

export async function getSpendLogsCount(
  params: Pick<ProxySpendLogsQueryParams, "model" | "startDate" | "endDate">,
): Promise<number> {
  const conditions = buildWhereConditions(params);
  const whereClause = buildProxyWhereClause(conditions);

  const result = await queryRaw<{ count: number }>(
    sql.raw(`
      SELECT COUNT(*)::float as "count"
      FROM "${PROXY_REQUESTS_TABLE}" r
      ${whereClause}
    `),
    [],
  );

  return Number(result[0]?.count ?? 0);
}

export async function getSpendLogDetail(requestId: string) {
  const rows = await queryRaw<Record<string, unknown>>(
    sql.raw(`
      SELECT r.*
      FROM "${PROXY_REQUESTS_TABLE}" r
      WHERE r."id" = '${requestId.replace(/'/g, "''")}'
      LIMIT 1
    `),
    [],
  );

  if (rows.length === 0) return null;

  const row = rows[0];

  const [messages, adjustments] = await Promise.all([
    queryRaw<ModelProxyMessage>(
      sql.raw(
        `SELECT * FROM "model_proxy_messages" WHERE "request_id" = '${requestId.replace(/'/g, "''")}' ORDER BY "created_at" ASC`,
      ),
      [],
    ),
    queryRaw<ModelProxyUsageAdjustment>(
      sql.raw(
        `SELECT * FROM "model_proxy_usage_adjustments" WHERE "request_id" = '${requestId.replace(/'/g, "''")}' ORDER BY "created_at" ASC`,
      ),
      [],
    ),
  ]);

  return {
    ...row,
    messages,
    usageAdjustments: adjustments,
  };
}

export interface SpendTotalsFilters {
  model?: string;
  startDate?: string;
  endDate?: string;
}

export interface SpendTotals {
  request_count: number;
  total_tokens: number;
  total_cost: number;
  error_count: number;
  avg_latency_ms: number;
}

export async function getSpendTotals(
  params: SpendTotalsFilters,
): Promise<SpendTotals> {
  const conditions: string[] = [];
  if (params.model) {
    conditions.push(`r."model" = '${params.model.replace(/'/g, "''")}'`);
  }
  if (params.startDate) {
    conditions.push(`r."started_at" >= '${params.startDate}'`);
  }
  if (params.endDate) {
    conditions.push(`r."started_at" <= '${params.endDate}'`);
  }
  const where = buildProxyWhereClause(conditions);
  const errorWhere = where
    ? `${where} AND r."status" IN ('failed', 'timeout')`
    : `WHERE r."status" IN ('failed', 'timeout')`;

  const [aggregateResult, errorResult] = await Promise.all([
    queryRaw<{
      request_count: number;
      total_tokens: number;
      total_cost: number;
      avg_latency_ms: number;
    }>(
      sql.raw(`
        SELECT
          COUNT(*)::float as "request_count",
          COALESCE(SUM(${adjustedTotalTokensSql("r")}), 0)::float as "total_tokens",
          COALESCE(SUM(${adjustedTotalCostSql("r")}), 0)::float as "total_cost",
          COALESCE(AVG(r."latency_ms"), 0)::float as "avg_latency_ms"
        FROM "${PROXY_REQUESTS_TABLE}" r
        ${proxyAdjustmentsJoin("r")}
        ${where}
      `),
      [],
    ),
    queryRaw<{ error_count: number }>(
      sql.raw(`
        SELECT COUNT(*)::float as "error_count"
        FROM "${PROXY_REQUESTS_TABLE}" r
        ${errorWhere}
      `),
      [],
    ),
  ]);

  const aggregate = aggregateResult[0];
  const errors = errorResult[0];

  return {
    request_count: Number(aggregate?.request_count ?? 0),
    total_tokens: Number(aggregate?.total_tokens ?? 0),
    total_cost: Number(aggregate?.total_cost ?? 0),
    error_count: Number(errors?.error_count ?? 0),
    avg_latency_ms: Math.round(Number(aggregate?.avg_latency_ms ?? 0)),
  };
}

function buildIdList(ids: string[]): string {
  return ids.map((id) => `'${String(id).replace(/'/g, "''")}'`).join(",");
}

function groupByRequestId<T extends Record<string, unknown>>(
  items: T[],
  key: string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = String(item[key]);
    const list = map.get(k) ?? [];
    list.push(item);
    map.set(k, list);
  }
  return map;
}

export type SpendLogRow = Record<string, unknown> & {
  messages: ModelProxyMessage[];
  usageAdjustments: ModelProxyUsageAdjustment[];
};
