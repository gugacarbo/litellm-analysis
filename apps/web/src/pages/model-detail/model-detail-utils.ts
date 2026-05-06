import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/format";

export { formatCurrency, formatNumber, formatPercent };

export const CHART_HEIGHT = 300;

export const MODEL_DETAIL_CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function formatDuration(ms: number): string {
  const num = Number(ms);
  if (Number.isNaN(num)) return "0ms";
  if (num < 1000) return `${Math.round(num)}ms`;
  return `${(num / 1000).toFixed(1)}s`;
}

export function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    timeZone: APP_TIMEZONE,
  });
}
