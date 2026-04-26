import type { ErrorLog } from "../types/analytics";

export const AUTO_REFETCH_INTERVAL_MS = 5000;

export type ErrorFilters = {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
};

function parseStartDate(value: string): number | null {
  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function parseEndDate(value: string): number | null {
  const timestamp = new Date(`${value}T23:59:59.999`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function applyErrorFilters(
  errors: ErrorLog[],
  filters: ErrorFilters,
): ErrorLog[] {
  const normalizedUserFilter = filters.user?.trim().toLowerCase();
  const startDate = filters.startDate
    ? parseStartDate(filters.startDate)
    : null;
  const endDate = filters.endDate ? parseEndDate(filters.endDate) : null;

  return errors.filter((errorLog) => {
    if (filters.model && errorLog.model !== filters.model) {
      return false;
    }

    if (normalizedUserFilter) {
      const normalizedUser = (errorLog.user || "").toLowerCase();
      if (!normalizedUser.includes(normalizedUserFilter)) {
        return false;
      }
    }

    if (startDate !== null || endDate !== null) {
      const errorTime = new Date(errorLog.timestamp).getTime();
      if (Number.isNaN(errorTime)) {
        return false;
      }

      if (startDate !== null && errorTime < startDate) {
        return false;
      }

      if (endDate !== null && errorTime > endDate) {
        return false;
      }
    }

    return true;
  });
}
