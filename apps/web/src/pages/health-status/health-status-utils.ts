import type {
  HealthCheckResultEntry,
  HealthCheckStatus,
} from "./health-status-types";

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

export const STATUS_ORDER: Record<HealthCheckStatus, number> = {
  unknown: 99,
  error: 0,
  unhealthy: 1,
  healthy: 2,
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

export function sortByStatus(
  entries: HealthCheckResultEntry[],
): HealthCheckResultEntry[] {
  return [...entries].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99) ||
      a.modelName.localeCompare(b.modelName),
  );
}

export function getResponseTimeColor(
  ms: number | null,
): "green" | "yellow" | "red" | "muted" {
  if (ms === null) return "muted";
  if (ms < 300) return "green";
  if (ms < 1000) return "yellow";
  return "red";
}

export function getResponseTimeBarWidth(ms: number | null): number {
  if (ms === null) return 0;
  if (ms <= 100) return 10;
  if (ms <= 300) return 30;
  if (ms <= 500) return 50;
  if (ms <= 1000) return 70;
  return 100;
}

export function getHealthPercent(count: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}
