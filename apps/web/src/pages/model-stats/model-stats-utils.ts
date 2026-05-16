import {
  formatCompactNumber,
  formatCostPer1k,
  formatCurrency,
  formatDuration,
  formatNumber,
  safeDivide,
} from "@/lib/format";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";

export {
  formatCompactNumber,
  formatCostPer1k,
  formatCurrency,
  formatDuration,
  formatNumber,
  safeDivide,
};

export function formatTokensPerSecond(value: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)} tok/s`;
}

export function formatPercent(value: number): string {
  if (!value || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

export function getHealthColor(successRate: number): string {
  if (successRate >= 95) return "bg-emerald-500";
  if (successRate >= 85) return "bg-amber-500";
  return "bg-red-500";
}
