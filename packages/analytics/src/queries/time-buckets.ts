// packages/analytics/src/queries/time-buckets.ts

import { prisma } from "./client";

export interface TimeBucketConfig {
  minDays: number;
  maxDays: number;
  granularity: string;
  sqlBucket: string;
  sqlLabel: string;
  displayFormat: string;
}

/**
 * Granularity tiers — resolveTimeBucket selects the right tier based on
 * the number of days covered by the query.
 *
 * For lifetime (days=0), the actual range is auto-detected via MIN/MAX query.
 */
export const GRANULARITY_TIERS: TimeBucketConfig[] = [
  {
    minDays: 0,
    maxDays: 0.021, // ~30 minutes
    granularity: "30s",
    sqlBucket:
      "to_timestamp(floor(extract(epoch from \"startTime\") / 30) * 30)",
    sqlLabel:
      "to_char(to_timestamp(floor(extract(epoch from \"startTime\") / 30) * 30), 'HH24:MI:SS')",
    displayFormat: "HH:mm:ss",
  },
  {
    minDays: 0.021,
    maxDays: 0.208, // ~5 hours
    granularity: "1m",
    sqlBucket: "date_trunc('minute', \"startTime\")",
    sqlLabel: "to_char(date_trunc('minute', \"startTime\"), 'HH24:MI')",
    displayFormat: "HH:mm",
  },
  {
    minDays: 0.208,
    maxDays: 1,
    granularity: "1h",
    sqlBucket: "date_trunc('hour', \"startTime\")",
    sqlLabel:
      "to_char(date_trunc('hour', \"startTime\"), 'YYYY-MM-DD HH24:MI')",
    displayFormat: "HH:mm",
  },
  {
    minDays: 1,
    maxDays: 30,
    granularity: "1d",
    sqlBucket: 'DATE("startTime")',
    sqlLabel: 'CAST(DATE("startTime") AS TEXT)',
    displayFormat: "MMM dd",
  },
  {
    minDays: 30,
    maxDays: 90,
    granularity: "2d",
    sqlBucket:
      "to_timestamp(floor(extract(epoch from \"startTime\") / 172800) * 172800)",
    sqlLabel:
      "to_char(to_timestamp(floor(extract(epoch from \"startTime\") / 172800) * 172800), 'YYYY-MM-DD')",
    displayFormat: "MMM dd",
  },
  {
    minDays: 90,
    maxDays: 180,
    granularity: "1w",
    sqlBucket: "date_trunc('week', \"startTime\")",
    sqlLabel: "to_char(date_trunc('week', \"startTime\"), 'YYYY-\"W\"WW')",
    displayFormat: "MMM dd",
  },
  {
    minDays: 180,
    maxDays: 365,
    granularity: "2w",
    sqlBucket:
      "to_timestamp(floor(extract(epoch from \"startTime\") / 1209600) * 1209600)",
    sqlLabel:
      "to_char(to_timestamp(floor(extract(epoch from \"startTime\") / 1209600) * 1209600), 'YYYY-MM-DD')",
    displayFormat: "MMM yyyy",
  },
  {
    minDays: 365,
    maxDays: Infinity,
    granularity: "1mo",
    sqlBucket: "date_trunc('month', \"startTime\")",
    sqlLabel: "to_char(date_trunc('month', \"startTime\"), 'YYYY-MM')",
    displayFormat: "MMM yyyy",
  },
];

/** Cache for getDateRange — the range barely changes */
let _rangeCache: { min: Date; max: Date; ts: number } | null = null;
const CACHE_TTL = 300_000; // 5 minutes

/**
 * Get the actual date range of data in LiteLLM_SpendLogs.
 * Result is cached for 5 minutes.
 */
export async function getDateRange(): Promise<{
  min: Date;
  max: Date;
}> {
  if (_rangeCache && Date.now() - _rangeCache.ts < CACHE_TTL) {
    return { min: _rangeCache.min, max: _rangeCache.max };
  }
  const result = await prisma.$queryRawUnsafe<
    Array<{ min: Date; max: Date }>
  >(
    'SELECT MIN("startTime") as min, MAX("startTime") as max FROM "LiteLLM_SpendLogs"',
  );
  _rangeCache = {
    min: result[0].min,
    max: result[0].max,
    ts: Date.now(),
  };
  return { min: _rangeCache.min, max: _rangeCache.max };
}

/**
 * Resolve the appropriate time bucket config for a given day range.
 * For lifetime (days=0), auto-detects the actual date range to pick the right tier.
 */
export async function resolveTimeBucket(
  days: number,
): Promise<TimeBucketConfig> {
  if (days === 0) {
    const { min, max } = await getDateRange();
    const actualDays =
      (max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24);
    return resolveTimeBucketForDays(actualDays);
  }
  return resolveTimeBucketForDays(days);
}

function resolveTimeBucketForDays(days: number): TimeBucketConfig {
  const tier = GRANULARITY_TIERS.find(
    (t) => days >= t.minDays && days < t.maxDays,
  );
  return tier ?? GRANULARITY_TIERS[GRANULARITY_TIERS.length - 1];
}