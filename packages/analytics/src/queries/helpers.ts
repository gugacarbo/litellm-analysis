import { and, gte, type SQL, sql } from "drizzle-orm";
import { schema } from "./client";

const { spendLogs } = schema;

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
    // "Today" — since midnight of the current day
    now.setHours(0, 0, 0, 0);
    return now;
  }

  // Sub-day ranges (e.g. 0.0417 = 1h, 0.25 = 6h) and
  // multi-day ranges (e.g. 7.5 = 7 days 12 hours):
  // Use millisecond subtraction for sub-day precision.
  // setDate() truncates to integers and loses hour-level accuracy.
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() - ms);
}

export function getSpendLogsTimeCondition(days: number): SQL | undefined {
  const windowStart = getWindowStart(days);
  return windowStart ? gte(spendLogs.startTime, windowStart) : undefined;
}

export function getFailedSpendLogsCondition(): SQL {
  return sql`LOWER(COALESCE(${spendLogs.status}, '')) != 'success'`;
}

export function combineConditions(
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
