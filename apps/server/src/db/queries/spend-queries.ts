import { and, gte, type SQL, sql } from "drizzle-orm";
import { spendLogs } from "../schema";

export function normalizeDays(
  days: number | string | undefined,
  fallback: number,
) {
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
