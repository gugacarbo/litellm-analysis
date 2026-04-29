import type { ModelHealthStatus } from "./monitor-types";

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
  return count === 1 ? "1 alert" : `${count.toLocaleString("en-US")} alerts`;
}

export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}
