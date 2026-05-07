import {
  formatCompactNumber,
  formatCostPer1k,
  formatCurrency,
  formatNumber,
  safeDivide,
} from "@/lib/format";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";

export {
  formatCompactNumber,
  formatCostPer1k,
  formatCurrency,
  formatNumber,
  safeDivide,
};
export function formatDuration(ms) {
  if (!ms || Number.isNaN(ms)) return "-";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
export function formatTokensPerSecond(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)} tok/s`;
}
export function formatPercent(value) {
  if (!value || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}%`;
}
export function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}
export function getHealthColor(successRate) {
  if (successRate >= 95) return "bg-emerald-500";
  if (successRate >= 85) return "bg-amber-500";
  return "bg-red-500";
}
