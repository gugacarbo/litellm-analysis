import type { TimeRangeParams } from "../types/index";

export function normalizeDays(
  days: number | string | undefined,
  fallback: number,
) {
  const parsed = typeof days === "string" ? Number.parseFloat(days) : days;
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

  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() - ms);
}

/**
 * Returns a SQL WHERE clause fragment for time filtering,
 * or empty string if no filtering needed (days <= 0).
 */
export function getTimeFilterWhere(days: number): string {
  const windowStart = getWindowStart(days);
  if (!windowStart) return "";
  return `"startTime" >= '${windowStart.toISOString()}'`;
}

/**
 * Returns a SQL WHERE clause fragment for time filtering using absolute dates.
 * If startDate is provided, filters from that date.
 * If endDate is provided, filters up to that date (inclusive).
 */
export function getDateRangeFilterWhere(params: TimeRangeParams): string {
  const conditions: string[] = [];

  if (params.startDate) {
    conditions.push(`"startTime" >= '${params.startDate}'`);
  }

  if (params.endDate) {
    conditions.push(`"startTime" <= '${params.endDate}'`);
  }

  return conditions.join(" AND ");
}

/**
 * Returns the appropriate time filter based on params.
 * If startDate/endDate are provided, uses absolute dates.
 * Otherwise, calculates from days parameter.
 */
export function getTimeRangeFilterWhere(params: TimeRangeParams): string {
  if (params.startDate || params.endDate) {
    return getDateRangeFilterWhere(params);
  }

  const days = params.days ?? 30;
  return getTimeFilterWhere(days);
}

export function getFailedSpendLogsFilter(): string {
  return `LOWER(COALESCE("status", '')) != 'success'`;
}

/**
 * Combine multiple SQL conditions with AND.
 * Filters out empty strings, returns empty string if none.
 */
export function combineSqlConditions(conditions: Array<string>): string {
  const valid = conditions.filter((c) => c.length > 0);
  if (valid.length === 0) return "";
  if (valid.length === 1) return valid[0];
  return valid.map((c) => `(${c})`).join(" AND ");
}

/**
 * Build a full WHERE clause from conditions.
 * Returns "" if no conditions, or "WHERE ..." if there are.
 */
export function buildWhereClause(conditions: Array<string>): string {
  const combined = combineSqlConditions(conditions);
  return combined ? `WHERE ${combined}` : "";
}

/**
 * Get the window start Date for a given number of days.
 * Returns null if days <= 0.
 */
export function getWindowStartDate(days: number): Date | null {
  return getWindowStart(days);
}
