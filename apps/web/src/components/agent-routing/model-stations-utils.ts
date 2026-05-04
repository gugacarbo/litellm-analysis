// Shared utilities for model station cards
// Color utilities for consistent model visualization

export const MODEL_COLORS = [
  {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    text: "text-sky-600",
    dot: "bg-sky-500",
  },
  {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-600",
    dot: "bg-violet-500",
  },
  {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-600",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-600",
    dot: "bg-cyan-500",
  },
  {
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
    text: "text-fuchsia-600",
    dot: "bg-fuchsia-500",
  },
  {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    text: "text-teal-600",
    dot: "bg-teal-500",
  },
] as const;

// Extended color palette for richer visualizations
export const MODEL_HEALTH_COLORS = {
  excellent: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  good: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    text: "text-teal-600",
    dot: "bg-teal-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  error: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-600",
    dot: "bg-rose-500",
  },
} as const;

export type ModelColor = (typeof MODEL_COLORS)[number];

export function getModelColor(modelName: string): ModelColor {
  let hash = 0;
  for (let i = 0; i < modelName.length; i++) {
    hash = modelName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MODEL_COLORS[Math.abs(hash) % MODEL_COLORS.length];
}

export type HealthLevel = keyof typeof MODEL_HEALTH_COLORS;

export function getHealthLevel(
  successRate: number | null,
  errorCount: number,
): HealthLevel {
  if (successRate === null || successRate >= 99) return "excellent";
  if (successRate >= 95) return "good";
  if (successRate >= 80 || errorCount > 0) return "warning";
  return "error";
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  if (amount >= 1) {
    return `$${amount.toFixed(2)}`;
  }
  if (amount >= 0.01) {
    return `$${amount.toFixed(4)}`;
  }
  return `$${amount.toExponential(2)}`;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "N/A";
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return "N/A";
  return `${value.toFixed(1)}%`;
}

export function getHealthColor(successRate: number | null): string {
  if (successRate === null) return "bg-muted-foreground";
  if (successRate >= 98) return "bg-emerald-500";
  if (successRate >= 90) return "bg-sky-500";
  if (successRate >= 80) return "bg-amber-500";
  return "bg-rose-500";
}

export function getHealthLabel(successRate: number | null): string {
  if (successRate === null) return "No data";
  if (successRate >= 98) return "Excellent";
  if (successRate >= 90) return "Good";
  if (successRate >= 80) return "Fair";
  return "Poor";
}
