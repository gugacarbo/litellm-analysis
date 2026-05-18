import { APP_LOCALE, APP_TIMEZONE } from "@/shared/lib/locale";
import type { AlertMetadata } from "./monitor-types";

export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString(APP_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}

export const ANOMALY_TYPE_LABELS: Record<string, string> = {
  model_offline: "Model Offline",
  error_spike: "Error Spike",
  timeout_stuck: "Timeout/Stuck",
  silent_failure: "Silent Failure",
};

export const ANOMALY_TYPE_COLORS: Record<string, string> = {
  model_offline:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700",
  error_spike:
    "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700",
  timeout_stuck:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
  silent_failure:
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700",
};

export function formatAnomalyType(type: string): string {
  return ANOMALY_TYPE_LABELS[type] ?? type;
}

export function parseAlertMetadata(raw: string | null): AlertMetadata | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AlertMetadata;
  } catch {
    return null;
  }
}
