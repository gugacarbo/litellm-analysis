/**
 * Shared formatting utilities consolidated from across the web app.
 */

import { APP_LOCALE } from "@/lib/locale";

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat(APP_LOCALE).format(value);
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return new Intl.NumberFormat(APP_LOCALE, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatPercent(value: number): string {
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

export function normalizePercent(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(APP_LOCALE, {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
