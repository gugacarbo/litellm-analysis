import { APP_LOCALE } from "@/lib/locale";
import type {
  DashboardDateRangeKey,
  DashboardDateRangeOption,
} from "./dashboard-types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(APP_LOCALE).format(value);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(APP_LOCALE, {
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function safeDivide(
  numerator: number,
  denominator: number,
  fallback = 0,
): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return fallback;
  }
  if (denominator <= 0) {
    return fallback;
  }
  return numerator / denominator;
}

export function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value <= 1 ? value * 100 : value;
}

export const DASHBOARD_DATE_RANGES: DashboardDateRangeOption[] = [
  {
    key: "1h",
    label: "1 hora",
    days: 0.0417,
    description: "Última 1 hora",
  },
  {
    key: "6h",
    label: "6 horas",
    days: 0.25,
    description: "Últimas 6 horas",
  },
  {
    key: "24h",
    label: "24h",
    days: 0.99999,
    description: "Últimas 24 horas",
  },
  {
    key: "today",
    label: "Hoje",
    days: 1,
    description: "Hoje",
  },
  {
    key: "7d",
    label: "7 dias",
    days: 7,
    description: "Últimos 7 dias",
  },
  {
    key: "30d",
    label: "30 dias",
    days: 30,
    description: "Últimos 30 dias",
  },
  {
    key: "60d",
    label: "60 dias",
    days: 60,
    description: "Últimos 60 dias",
  },
  {
    key: "90d",
    label: "90 dias",
    days: 90,
    description: "Últimos 90 dias",
  },
  {
    key: "all",
    label: "Tudo",
    days: 0,
    description: "Todo o histórico",
  },
  {
    key: "custom",
    label: "Personalizado",
    days: 0,
    description: "Período personalizado",
  },
];

export function getDateRangeDays(range: DashboardDateRangeKey): number {
  return DASHBOARD_DATE_RANGES.find((item) => item.key === range)?.days ?? 30;
}

export function getDateRangeLabel(range: DashboardDateRangeKey): string {
  return (
    DASHBOARD_DATE_RANGES.find((item) => item.key === range)?.description ??
    "Últimos 30 dias"
  );
}
