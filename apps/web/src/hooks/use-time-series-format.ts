// apps/web/src/hooks/use-time-series-format.ts
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";

type TimeGranularity = "30s" | "1m" | "1h" | "1d" | "2d" | "1w" | "2w" | "1mo";

export interface TimeSeriesFormat {
  /** Format X-axis tick labels */
  formatX: (value: string) => string;
  /** Format tooltip label */
  formatTooltipLabel: (value: string) => string;
  /** Recharts interval: show every Nth tick */
  tickInterval: number;
}

type IntlOpts = Intl.DateTimeFormatOptions;

const X_FORMAT_MAP: Record<TimeGranularity, IntlOpts> = {
  "30s": { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  "1m": { hour: "2-digit", minute: "2-digit" },
  "1h": { hour: "2-digit", minute: "2-digit" },
  "1d": { month: "short", day: "numeric" },
  "2d": { month: "short", day: "numeric" },
  "1w": { month: "short", day: "numeric" },
  "2w": { month: "short", year: "numeric" },
  "1mo": { month: "short", year: "numeric" },
};

const TOOLTIP_FORMAT_MAP: Record<TimeGranularity, IntlOpts> = {
  "30s": {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  },
  "1m": { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  "1h": { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  "1d": { month: "short", day: "numeric", year: "numeric" },
  "2d": { month: "short", day: "numeric", year: "numeric" },
  "1w": { month: "short", day: "numeric", year: "numeric" },
  "2w": { month: "short", day: "numeric", year: "numeric" },
  "1mo": { month: "short", day: "numeric", year: "numeric" },
};

const TICK_INTERVAL_MAP: Record<TimeGranularity, number> = {
  "30s": 10,
  "1m": 15,
  "1h": 6,
  "1d": 1,
  "2d": 1,
  "1w": 1,
  "2w": 1,
  "1mo": 1,
};

const FALLBACK_FORMAT: IntlOpts = { month: "short", day: "numeric" };

function safeFormat(value: string, opts: Intl.DateTimeFormatOptions): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(APP_LOCALE, {
    ...opts,
    timeZone: APP_TIMEZONE,
  });
}

export function useTimeSeriesFormat(granularity?: string): TimeSeriesFormat {
  const key = (granularity ?? "1d") as TimeGranularity;
  const xOpts = key in X_FORMAT_MAP ? X_FORMAT_MAP[key] : FALLBACK_FORMAT;
  const tooltipOpts =
    key in TOOLTIP_FORMAT_MAP
      ? TOOLTIP_FORMAT_MAP[key]
      : { ...FALLBACK_FORMAT, year: "numeric" as const };
  const tickInterval = key in TICK_INTERVAL_MAP ? TICK_INTERVAL_MAP[key] : 1;

  const formatX = (value: string): string => safeFormat(value, xOpts);

  const formatTooltipLabel = (value: string): string =>
    safeFormat(value, tooltipOpts);

  return { formatX, formatTooltipLabel, tickInterval };
}
