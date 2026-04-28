/**
 * Returns Tailwind badge classes for HTTP status codes.
 * 5xx → red, 4xx → amber, other → muted.
 */
export function getStatusBadgeClass(statusCode: number): string {
  if (statusCode >= 500) {
    return "bg-red-500/15 text-red-700 border-red-500/30";
  }

  if (statusCode >= 400) {
    return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  }

  return "bg-muted text-muted-foreground";
}

/**
 * Returns Tailwind badge classes for error type keywords.
 * "rate" → sky, "timeout" → yellow, "auth"/"key" → red, other → muted.
 */
export function getErrorTypeBadgeClass(errorType: string): string {
  const normalizedType = errorType.toLowerCase();

  if (normalizedType.includes("rate")) {
    return "bg-sky-500/15 text-sky-700 border-sky-500/30";
  }

  if (normalizedType.includes("timeout")) {
    return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";
  }

  if (normalizedType.includes("auth") || normalizedType.includes("key")) {
    return "bg-red-500/15 text-red-700 border-red-500/30";
  }

  return "bg-muted text-muted-foreground";
}
