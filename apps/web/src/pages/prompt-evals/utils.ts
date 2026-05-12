export function formatTimestamp(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString();
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

export function formatF1(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(4);
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
