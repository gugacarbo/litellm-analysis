import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
export const STATUS_ORDER = {
  offline: 0,
  degraded: 1,
  healthy: 2,
  unknown: 3,
};
export const STATUS_COLORS = {
  offline: "bg-red-500/15 text-red-700 border-red-500/30",
  degraded: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  healthy: "bg-green-500/15 text-green-700 border-green-500/30",
  unknown: "bg-gray-500/15 text-gray-700 border-gray-500/30",
};
export function formatAlertCount(count) {
  return count === 1 ? "1 alert" : `${count.toLocaleString(APP_LOCALE)} alerts`;
}
export function formatTimestamp(unixSeconds) {
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
const ANOMALY_TYPE_LABELS = {
  model_offline: "Model Offline",
  error_spike: "Error Spike",
  timeout_stuck: "Timeout/Stuck",
  silent_failure: "Silent Failure",
};
export function formatAnomalyType(type) {
  return ANOMALY_TYPE_LABELS[type] ?? type;
}
export function parseAlertMetadata(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
