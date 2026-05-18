import type { HealthCheckStatus } from "./health-status-types";

export const STATUS_COLORS: Record<HealthCheckStatus, string> = {
  healthy: "#10b981",
  unhealthy: "#f59e0b",
  error: "#ef4444",
  unknown: "#9ca3af",
};

export const STATUS_LABELS: Record<HealthCheckStatus, string> = {
  healthy: "Healthy",
  unhealthy: "Unhealthy",
  error: "Error",
  unknown: "Not tested",
};

export function formatResponseTime(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatTokensPerSecond(tokensPerSecond: number | null): string {
  if (tokensPerSecond === null) return "—";
  if (tokensPerSecond < 10) return `${tokensPerSecond.toFixed(2)} tok/s`;
  return `${tokensPerSecond.toFixed(1)} tok/s`;
}

export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString();
}

export function formatRelativeTime(unixSeconds: number): string {
  const diff = Date.now() - unixSeconds * 1000;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
