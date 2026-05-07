import { env } from "../env";

const DEFAULT_LOCALE = "en-US";
const DEFAULT_TIMEZONE = "UTC";
const SUPPORTED_TIMEZONES = [
  "UTC",
  "America/Sao_Paulo",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];
export function getBrowserLocale() {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  const browserLocales = navigator.languages?.filter((locale) => locale.trim());
  const browserLocale = browserLocales?.[0] ?? navigator.language?.trim();
  return browserLocale || undefined;
}
export function getBrowserTimezone() {
  if (typeof Intl === "undefined") {
    return DEFAULT_TIMEZONE;
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}
export function isValidTimezone(tz) {
  return SUPPORTED_TIMEZONES.includes(tz);
}
export function normalizeTimezone(tz) {
  if (!tz) return DEFAULT_TIMEZONE;
  return isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
}
export const APP_LOCALE =
  getBrowserLocale() || env.VITE_APP_LOCALE || DEFAULT_LOCALE;
export const APP_TIMEZONE =
  normalizeTimezone(env.VITE_APP_TIMEZONE) || getBrowserTimezone();
export const DEBUG_LOCALE = env.VITE_DEBUG_LOCALE === "true";
