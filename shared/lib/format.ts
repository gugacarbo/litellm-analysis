/**
 * Shared formatting utilities consolidated from across the web app.
 */

import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat(APP_LOCALE).format(value);
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (value > 0 && value < 0.01) {
    return new Intl.NumberFormat(APP_LOCALE, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  }
  return new Intl.NumberFormat(APP_LOCALE, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function formatCostPer1k(value: number): string {
  if (!Number.isFinite(value)) return "-";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

export function formatDuration(
  ms: number | null | undefined,
  maxUnit: "seconds" | "minutes" | "hours" | "days" = "seconds",
): string {
  if (ms === null || ms === undefined) return "N/A";
  if (!Number.isFinite(ms)) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const sec = ms / 1000;
  if (maxUnit === "seconds") return `${sec.toFixed(1)}s`;
  if (maxUnit === "minutes" && sec < 60) return `${sec.toFixed(1)}s`;
  if (maxUnit === "minutes") return `${(sec / 60).toFixed(1)}m`;
  if (maxUnit === "hours" && sec < 60) return `${sec.toFixed(1)}s`;
  if (maxUnit === "hours" && sec < 3600) return `${(sec / 60).toFixed(1)}m`;
  if (maxUnit === "hours") return `${(sec / 3600).toFixed(1)}h`;
  // days
  if (sec < 60) return `${sec.toFixed(1)}s`;
  if (sec < 3600) return `${(sec / 60).toFixed(1)}m`;
  if (sec < 86400) return `${(sec / 3600).toFixed(1)}h`;
  return `${(sec / 86400).toFixed(1)}d`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  if (!Number.isFinite(value)) return "0%";
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

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}
