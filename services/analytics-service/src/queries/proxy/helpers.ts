import type { TimeRangeParams } from "../../types/index";
import {
  buildWhereClause,
  combineSqlConditions,
  normalizeDays,
} from "../helpers";

export const PROXY_REQUESTS_TABLE = "model_proxy_requests";
export const PROXY_USAGE_ADJUSTMENTS_TABLE = "model_proxy_usage_adjustments";
export const PROXY_TIME_COLUMN = "started_at";

export function proxyAdjustmentsJoin(requestsAlias = "r"): string {
  return `
    LEFT JOIN (
      SELECT
        "request_id",
        COALESCE(SUM("prompt_tokens_delta"), 0) AS "prompt_tokens_delta",
        COALESCE(SUM("completion_tokens_delta"), 0) AS "completion_tokens_delta",
        COALESCE(SUM("total_cost_delta"), 0) AS "total_cost_delta"
      FROM "${PROXY_USAGE_ADJUSTMENTS_TABLE}"
      GROUP BY "request_id"
    ) adj ON adj."request_id" = ${requestsAlias}."id"
  `;
}

export function adjustedTotalCostSql(requestsAlias = "r"): string {
  return `(COALESCE(${requestsAlias}."total_cost", 0) + COALESCE(adj."total_cost_delta", 0))`;
}

export function adjustedTotalTokensSql(requestsAlias = "r"): string {
  return `(COALESCE(${requestsAlias}."total_tokens", 0) + COALESCE(adj."prompt_tokens_delta", 0) + COALESCE(adj."completion_tokens_delta", 0))`;
}

export function adjustedInputTokensSql(requestsAlias = "r"): string {
  return `(COALESCE(${requestsAlias}."input_tokens", 0) + COALESCE(adj."prompt_tokens_delta", 0))`;
}

export function adjustedOutputTokensSql(requestsAlias = "r"): string {
  return `(COALESCE(${requestsAlias}."output_tokens", 0) + COALESCE(adj."completion_tokens_delta", 0))`;
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

  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() - ms);
}

export function getProxyTimeFilterWhere(days: number): string {
  const windowStart = getWindowStart(days);
  if (!windowStart) {
    return "";
  }
  return `"${PROXY_TIME_COLUMN}" >= '${windowStart.toISOString()}'`;
}

function getProxyDateRangeFilterWhere(params: TimeRangeParams): string {
  const conditions: string[] = [];

  if (params.startDate) {
    conditions.push(`"${PROXY_TIME_COLUMN}" >= '${params.startDate}'`);
  }

  if (params.endDate) {
    conditions.push(`"${PROXY_TIME_COLUMN}" <= '${params.endDate}'`);
  }

  return conditions.join(" AND ");
}

export function getProxyTimeRangeFilterWhere(params: TimeRangeParams): string {
  if (params.startDate || params.endDate) {
    return getProxyDateRangeFilterWhere(params);
  }

  const days = params.days ?? 30;
  return getProxyTimeFilterWhere(days);
}

export function getProxyErrorFilter(): string {
  return `"status" IN ('failed', 'timeout')`;
}

export function getProxyNonSuccessFilter(): string {
  return `"status" IN ('failed', 'timeout', 'cancelled')`;
}

export function buildProxyWhereClause(conditions: Array<string>): string {
  return buildWhereClause(conditions);
}

export function proxyTimeCondition(params: TimeRangeParams): string {
  return getProxyTimeRangeFilterWhere(params);
}

export function normalizeProxyDays(
  days: number | string | undefined,
  fallback: number,
): number {
  return normalizeDays(days, fallback);
}

export function prefixProxyRequestColumns(
  sql: string,
  requestsAlias = "r",
): string {
  return sql
    .replace(/"started_at"/g, `${requestsAlias}."started_at"`)
    .replace(/"status"/g, `${requestsAlias}."status"`)
    .replace(/"model"/g, `${requestsAlias}."model"`);
}

export function combineProxyConditions(conditions: Array<string>): string {
  return combineSqlConditions(conditions);
}

export function calculateDaysFromDateRange(params: TimeRangeParams): number {
  if (params.days !== undefined) {
    return params.days;
  }
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
  }
  if (params.startDate) {
    const start = new Date(params.startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
  }
  return 30;
}
