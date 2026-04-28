export const CHART_HEIGHT = 300;

export const MODEL_DETAIL_CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function formatCurrency(value: number): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("en-US");
}

export function formatDuration(ms: number): string {
  const num = Number(ms);
  if (Number.isNaN(num)) return "0ms";
  if (num < 1000) return `${Math.round(num)}ms`;
  return `${(num / 1000).toFixed(1)}s`;
}

export function formatPercent(value: number): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "0%";
  return `${num.toFixed(1)}%`;
}

export function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
