import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
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

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  model_offline: "Model Offline",
  error_spike: "Error Spike",
  timeout_stuck: "Timeout/Stuck",
  silent_failure: "Silent Failure",
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
