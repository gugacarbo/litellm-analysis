import { getDateRangeDays, getDateRangeLabel } from "@/lib/date-ranges";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  safeDivide,
} from "@/lib/format";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";

export {
  formatCurrency,
  formatNumber,
  formatPercent,
  getDateRangeDays,
  getDateRangeLabel,
  safeDivide,
};

type Granularity = "30s" | "1m" | "1h" | "1d" | "2d" | "1w" | "2w" | "1mo";

/** Get the end date for a bucket based on its granularity */
function getBucketEndDate(startDate: Date, granularity: Granularity): Date {
  const end = new Date(startDate);
  switch (granularity) {
    case "30s":
      end.setSeconds(end.getSeconds() + 30);
      break;
    case "1m":
      end.setMinutes(end.getMinutes() + 1);
      break;
    case "1h":
      end.setHours(end.getHours() + 1);
      break;
    case "1d":
      end.setDate(end.getDate() + 1);
      break;
    case "2d":
      end.setDate(end.getDate() + 2);
      break;
    case "1w":
      end.setDate(end.getDate() + 7);
      break;
    case "2w":
      end.setDate(end.getDate() + 14);
      break;
    case "1mo":
      end.setMonth(end.getMonth() + 1);
      break;
  }
  return end;
}

/**
 * Format a date for chart labels based on granularity.
 * - Short buckets (30s, 1m, 1h): show exact time
 * - Long buckets (1d, 2d, 1w, 2w, 1mo): show "02-04 May" range format
 */
export function formatDateRange(
  date: string | Date,
  granularity: Granularity,
): string {
  const start = new Date(date);
  const end = getBucketEndDate(start, granularity);

  // Short buckets: show exact time
  if (granularity === "30s" || granularity === "1m" || granularity === "1h") {
    return start.toLocaleString(APP_LOCALE, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: APP_TIMEZONE,
    });
  }

  // Long buckets: show "02-04 May" format (manual to avoid "de" in pt-BR)
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const startDay = start.getUTCDate().toString().padStart(2, "0");

  const endDay = end.getUTCDate().toString().padStart(2, "0");
  const endMonth = months[end.getUTCMonth()];

  return `${startDay}-${endDay} ${endMonth}`;
}

export function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value <= 1 ? value * 100 : value;
}
