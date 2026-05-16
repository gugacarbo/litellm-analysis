import {
  formatCurrency,
  formatNumber,
  formatPercent,
  safeDivide,
} from "@/lib/format";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import type {
  DashboardDateRangeKey,
  DashboardDateRangeOption,
  DateRangeGroup,
} from "./dashboard-types";

export { formatCurrency, formatNumber, formatPercent, safeDivide };

/**
 * Format a date string for display.
 * - For "YYYY-MM-DD HH24:MI" format (hourly): shows time only
 * - For "YYYY-MM-DD" format (daily): shows month and day
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);

  // Check if the date string contains time component (hourly granularity)
  const dateStr = String(date);
  if (dateStr.includes(" ")) {
    // Hourly format: "2024-01-15 14:00" -> show time
    return d.toLocaleTimeString(APP_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: APP_TIMEZONE,
    });
  }

  // Daily format: "2024-01-15" -> show month and day
  return d.toLocaleDateString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

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

export const HOURS_OPTIONS: DashboardDateRangeOption[] = [
  {
    key: "15m",
    label: "15 min",
    days: 0.0104,
    description: "Últimos 15 minutos",
  },
  { key: "1h", label: "1 hora", days: 0.0417, description: "Última 1 hora" },
  { key: "5h", label: "5 horas", days: 0.208, description: "Últimas 5 horas" },
  { key: "12h", label: "12 horas", days: 0.5, description: "Últimas 12 horas" },
];
export const DAYS_OPTIONS: DashboardDateRangeOption[] = [
  { key: "24h", label: "24h", days: 1, description: "Últimas 24 horas" },
  { key: "7d", label: "7 dias", days: 7, description: "Últimos 7 dias" },
  { key: "14d", label: "14 dias", days: 14, description: "Últimos 14 dias" },
  { key: "30d", label: "30 dias", days: 30, description: "Últimos 30 dias" },
];
const CUSTOM_OPTION: DashboardDateRangeOption = {
  key: "custom",
  label: "Personalizado",
  days: 0,
  description: "Período personalizado",
};

const LIFETIME_OPTION: DashboardDateRangeOption = {
  key: "lifetime",
  label: "Lifetime",
  days: 0,
  description: "Todos os dados desde sempre",
};

// Derive from HOURS_OPTIONS + DAYS_OPTIONS to avoid duplication
export const DASHBOARD_DATE_RANGES: DashboardDateRangeOption[] = [
  ...HOURS_OPTIONS,
  ...DAYS_OPTIONS,
  LIFETIME_OPTION,
  CUSTOM_OPTION,
];
export function getDateRangeGroup(key: DashboardDateRangeKey): DateRangeGroup {
  if (key === "custom") return "custom";
  const hoursKeys = HOURS_OPTIONS.map((o) => o.key);
  if (hoursKeys.includes(key)) return "hours";
  return "days";
}
export function getDateRangeDays(range: DashboardDateRangeKey): number {
  return DASHBOARD_DATE_RANGES.find((item) => item.key === range)?.days ?? 30;
}

export function getDateRangeLabel(range: DashboardDateRangeKey): string {
  return (
    DASHBOARD_DATE_RANGES.find((item) => item.key === range)?.description ??
    "Últimos 30 dias"
  );
}
