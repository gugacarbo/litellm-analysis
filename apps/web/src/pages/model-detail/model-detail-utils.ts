import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export { formatCurrency, formatNumber, formatPercent };

export const CHART_HEIGHT = 300;

export function formatDuration(ms: number): string {
  const num = Number(ms);
  if (Number.isNaN(num)) return "0ms";
  if (num < 1000) return `${Math.round(num)}ms`;
  return `${(num / 1000).toFixed(1)}s`;
}
