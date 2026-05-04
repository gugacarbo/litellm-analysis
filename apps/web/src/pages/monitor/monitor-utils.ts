import type { AlertMetadata, ModelHealthStatus } from "./monitor-types";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";

export const STATUS_ORDER: Record<ModelHealthStatus, number> = {
  offline: 0,
  degraded: 1,
  healthy: 2,
  unknown: 3,
};

export const STATUS_COLORS: Record<ModelHealthStatus, string> = {
  offline: "bg-red-500/15 text-red-700 border-red-500/30",
  degraded: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  healthy: "bg-green-500/15 text-green-700 border-green-500/30",
  unknown: "bg-gray-500/15 text-gray-700 border-gray-500/30",
};

export function formatAlertCount(count: number): string {
  return count === 1 ? "1 alert" : `${count.toLocaleString(APP_LOCALE)} alerts`;
}

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
