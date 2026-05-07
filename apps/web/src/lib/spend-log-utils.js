import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";

// Re-export common formatters from the canonical source
export {
  formatCompactNumber,
  formatCostPer1k,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
  normalizePercent,
  safeDivide,
} from "@/lib/format";
export function formatTime(date) {
  return new Date(date).toLocaleString(APP_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  });
}
export function formatTimeRelative(date) {
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
export function formatFullDateTime(date) {
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
export function calculateTokensPerSecond(completionTokens, startTime, endTime) {
  const durationMs =
    new Date(endTime).getTime() - new Date(startTime).getTime();
  if (durationMs <= 0 || !completionTokens) return "-";
  const tokensPerSec = completionTokens / (durationMs / 1000);
  return `${tokensPerSec.toFixed(1)}/s`;
}
export function maskApiKey(key) {
  if (!key) return "N/A";
  if (key.length <= 8) return key;
  return `${key.substring(0, 6)}...${key.slice(-4)}`;
}
