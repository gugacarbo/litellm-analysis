import type { ProxyRequestLog } from "@/shared/lib/api-client/spend";
import { APP_LOCALE, APP_TIMEZONE } from "@/shared/lib/locale";

// Re-export common formatters from the canonical source
export {
  formatCurrency,
  formatDuration,
  formatNumber,
} from "@/shared/lib/format";

export function formatTimeRelative(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleString(APP_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: APP_TIMEZONE,
    });
  }

  return d.toLocaleString(APP_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  });
}

export function formatFullDateTime(date: string | Date): string {
  return new Date(date).toLocaleString(APP_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}

export function isProxyLogSuccess(status: string): boolean {
  return status === "200" || status === "success";
}

export function getProxyLogDurationMs(log: ProxyRequestLog): number {
  if (log.latency_ms != null && log.latency_ms >= 0) {
    return log.latency_ms;
  }
  if (!log.finished_at) return 0;
  const start = new Date(log.started_at).getTime();
  const end = new Date(log.finished_at).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return end - start;
}

export function getProxyLogInputTokens(log: ProxyRequestLog): number {
  return log.input_tokens ?? 0;
}

export function getProxyLogOutputTokens(log: ProxyRequestLog): number {
  return log.output_tokens ?? 0;
}

export function getProxyLogTotalCost(log: ProxyRequestLog): number {
  return log.total_cost ?? 0;
}

function calculateTokensPerSecond(
  outputTokens: number,
  startedAt: string,
  finishedAt: string | null,
  latencyMs?: number | null,
): string {
  const durationMs =
    latencyMs != null && latencyMs > 0
      ? latencyMs
      : finishedAt
        ? new Date(finishedAt).getTime() - new Date(startedAt).getTime()
        : 0;
  if (durationMs <= 0 || !outputTokens) return "-";

  const tokensPerSec = outputTokens / (durationMs / 1000);
  return `${tokensPerSec.toFixed(1)}/s`;
}

export function calculateProxyLogTokensPerSecond(log: ProxyRequestLog): string {
  return calculateTokensPerSecond(
    getProxyLogOutputTokens(log),
    log.started_at,
    log.finished_at,
    log.latency_ms,
  );
}

export const ESTIMATED_USAGE_TOOLTIP =
  "Token counts were estimated locally and may differ from provider billing.";
export const ESTIMATED_COST_TOOLTIP =
  "Cost was estimated from local rates or estimated usage and may differ from provider billing.";
