export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDuration(ms: number): string {
  if (!ms || Number.isNaN(ms)) return "-";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

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
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCostPer1k(value: number): string {
  if (!value || Number.isNaN(value)) return "-";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function safeDivide(a: number, b: number, fallback = 0): number {
  if (!b || Number.isNaN(b)) return fallback;
  return a / b;
}

export function getHealthColor(successRate: number): string {
  if (successRate >= 95) return "bg-emerald-500";
  if (successRate >= 85) return "bg-amber-500";
  return "bg-red-500";
}
