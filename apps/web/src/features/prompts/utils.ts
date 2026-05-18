export function formatTimestamp(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString();
}

export function formatRelativeTime(seconds: number): string {
  const now = Date.now() / 1000;
  const diff = now - seconds;

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(seconds * 1000).toLocaleDateString();
}

export function formatDuration(
  startSeconds: number,
  endSeconds: number | null,
): string {
  if (!endSeconds) return "—";
  const diff = endSeconds - startSeconds;
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

export function formatPrecision(
  value: number | null | undefined,
  decimals = 4,
): string {
  if (value == null) return "—";
  return value.toFixed(decimals);
}

export function getScoreColor(value: number | null | undefined): string {
  if (value == null) return "text-muted-foreground";
  if (value >= 0.9) return "text-green-500";
  if (value >= 0.7) return "text-yellow-500";
  return "text-red-500";
}

export function statusVariant(
  status: string,
): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case "succeeded":
      return "default";
    case "failed":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "secondary";
  }
}
