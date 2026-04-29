import { env } from "../env";

const DEFAULT_LOCALE = "en-US";

export function getBrowserLocale(): string | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  const browserLocales = navigator.languages?.filter((locale) => locale.trim());
  const browserLocale = browserLocales?.[0] ?? navigator.language?.trim();

  return browserLocale || undefined;
}

export const APP_LOCALE =
  getBrowserLocale() ||
  env.VITE_APP_LOCALE ||
  DEFAULT_LOCALE;
