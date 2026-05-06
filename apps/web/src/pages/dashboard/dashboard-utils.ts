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

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
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
export const CUSTOM_OPTION: DashboardDateRangeOption = {
  key: "custom",
  label: "Personalizado",
  days: 0,
  description: "Período personalizado",
};

// Derive from HOURS_OPTIONS + DAYS_OPTIONS to avoid duplication
export const DASHBOARD_DATE_RANGES: DashboardDateRangeOption[] = [
  ...HOURS_OPTIONS,
  ...DAYS_OPTIONS,
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
