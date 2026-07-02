import { queryRaw } from "@lite-llm/database/client";
import { sql } from "drizzle-orm";
import { PROXY_REQUESTS_TABLE, PROXY_TIME_COLUMN } from "./helpers";

export interface ProxyTimeBucketConfig {
  minDays: number;
  maxDays: number;
  granularity: string;
  sqlBucket: string;
  sqlLabel: string;
  displayFormat: string;
}

const GRANULARITY_TIERS: ProxyTimeBucketConfig[] = [
  {
    minDays: 0,
    maxDays: 0.021,
    granularity: "30s",
    sqlBucket: `to_timestamp(floor(extract(epoch from "${PROXY_TIME_COLUMN}") / 30) * 30)`,
    sqlLabel: `to_char(to_timestamp(floor(extract(epoch from "${PROXY_TIME_COLUMN}") / 30) * 30), 'HH24:MI:SS')`,
    displayFormat: "HH:mm:ss",
  },
  {
    minDays: 0.021,
    maxDays: 0.208,
    granularity: "1m",
    sqlBucket: `date_trunc('minute', "${PROXY_TIME_COLUMN}")`,
    sqlLabel: `to_char(date_trunc('minute', "${PROXY_TIME_COLUMN}"), 'HH24:MI')`,
    displayFormat: "HH:mm",
  },
  {
    minDays: 0.208,
    maxDays: 1,
    granularity: "1h",
    sqlBucket: `date_trunc('hour', "${PROXY_TIME_COLUMN}")`,
    sqlLabel: `to_char(date_trunc('hour', "${PROXY_TIME_COLUMN}"), 'YYYY-MM-DD HH24:MI')`,
    displayFormat: "HH:mm",
  },
  {
    minDays: 1,
    maxDays: 30,
    granularity: "1d",
    sqlBucket: `DATE("${PROXY_TIME_COLUMN}")`,
    sqlLabel: `CAST(DATE("${PROXY_TIME_COLUMN}") AS TEXT)`,
    displayFormat: "MMM dd",
  },
  {
    minDays: 30,
    maxDays: 90,
    granularity: "2d",
    sqlBucket: `to_timestamp(floor(extract(epoch from "${PROXY_TIME_COLUMN}") / 172800) * 172800)`,
    sqlLabel: `to_char(to_timestamp(floor(extract(epoch from "${PROXY_TIME_COLUMN}") / 172800) * 172800), 'YYYY-MM-DD')`,
    displayFormat: "MMM dd",
  },
  {
    minDays: 90,
    maxDays: 180,
    granularity: "1w",
    sqlBucket: `date_trunc('week', "${PROXY_TIME_COLUMN}")`,
    sqlLabel: `to_char(date_trunc('week', "${PROXY_TIME_COLUMN}"), 'YYYY-"W"WW')`,
    displayFormat: "MMM dd",
  },
  {
    minDays: 180,
    maxDays: 365,
    granularity: "2w",
    sqlBucket: `to_timestamp(floor(extract(epoch from "${PROXY_TIME_COLUMN}") / 1209600) * 1209600)`,
    sqlLabel: `to_char(to_timestamp(floor(extract(epoch from "${PROXY_TIME_COLUMN}") / 1209600) * 1209600), 'YYYY-MM-DD')`,
    displayFormat: "MMM yyyy",
  },
  {
    minDays: 365,
    maxDays: Infinity,
    granularity: "1mo",
    sqlBucket: `date_trunc('month', "${PROXY_TIME_COLUMN}")`,
    sqlLabel: `to_char(date_trunc('month', "${PROXY_TIME_COLUMN}"), 'YYYY-MM')`,
    displayFormat: "MMM yyyy",
  },
];

let rangeCache: { min: Date; max: Date; ts: number } | null = null;
const CACHE_TTL = 300_000;

async function getDateRange(): Promise<{ min: Date; max: Date }> {
  if (rangeCache && Date.now() - rangeCache.ts < CACHE_TTL) {
    return { min: rangeCache.min, max: rangeCache.max };
  }

  const result = await queryRaw<{ min: Date; max: Date }>(
    sql.raw(`SELECT MIN("${PROXY_TIME_COLUMN}") as min, MAX("${PROXY_TIME_COLUMN}") as max FROM "${PROXY_REQUESTS_TABLE}"`),
    [],
  );

  rangeCache = {
    min: result[0].min,
    max: result[0].max,
    ts: Date.now(),
  };
  return { min: rangeCache.min, max: rangeCache.max };
}

export async function resolveProxyTimeBucket(
  days: number,
): Promise<ProxyTimeBucketConfig> {
  if (days === 0) {
    const { min, max } = await getDateRange();
    const actualDays = (max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24);
    return resolveProxyTimeBucketForDays(actualDays);
  }
  return resolveProxyTimeBucketForDays(days);
}

function resolveProxyTimeBucketForDays(days: number): ProxyTimeBucketConfig {
  const tier = GRANULARITY_TIERS.find(
    (entry) => days >= entry.minDays && days < entry.maxDays,
  );
  return tier ?? GRANULARITY_TIERS[GRANULARITY_TIERS.length - 1];
}
