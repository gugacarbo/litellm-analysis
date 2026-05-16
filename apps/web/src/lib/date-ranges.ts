/**
 * Shared date range types, constants, and utilities.
 * Extracted from pages/dashboard/dashboard-types.ts and pages/dashboard/dashboard-utils.ts
 * for shared access across lib, contexts, and components.
 */

export type DashboardDateRangeKey =
  | "15m"
  | "1h"
  | "5h"
  | "12h"
  | "24h"
  | "7d"
  | "14d"
  | "30d"
  | "lifetime"
  | "custom";

export type DateRangeGroup = "hours" | "days" | "custom";

export type TimeRangeValue = {
  preset?: DashboardDateRangeKey;
  from?: Date;
  to?: Date;
};

export type DashboardDateRangeOption = {
  key: DashboardDateRangeKey;
  label: string;
  days: number;
  description: string;
};

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
