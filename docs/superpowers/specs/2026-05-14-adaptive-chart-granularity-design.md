# Adaptive Chart Granularity + Reusable TimeSeriesCard

**Date:** 2026-05-14
**Status:** Approved
**Scope:** Backend time-bucketing, frontend chart component, 8 chart migrations

## Problem

Charts are always grouped by day for ranges >= 1 day. With lifetime view (`days=0`), this produces hundreds of data points — visually noisy and hard to read. Shorter ranges (e.g., 15 min) also underserve the available resolution.

Additionally, all 8 timeline charts are standalone implementations duplicating Card + Skeleton + ResponsiveContainer + tooltip setup (~80-120 lines each).

## Solution Overview

**Config-driven granularity tiers** — a central table defines bucket intervals, SQL expressions, and display formats. Backend queries call `resolveTimeBucket(days)` to get the right bucketing. Frontend gets a `TimeSeriesCard` component that encapsulates all boilerplate.

### Approach: Config-driven with explicit tiers (Option 2)

A configuration table maps day ranges to bucket sizes. Each tier specifies SQL expressions for GROUP BY and labeling, plus a frontend display format. All time-series queries call a single shared function.

## Granularity Tiers

| Range | Bucket | SQL Bucket | SQL Label | Display Format |
|---|---|---|---|---|
| < 30 min (`days < 0.021`) | 30 seconds | `date_trunc('minute', "startTime") + INTERVAL '30 seconds' * FLOOR(EXTRACT(SECOND FROM "startTime") / 30)` | `to_char("startTime", 'HH24:MI:SS')` | `HH:mm:ss` |
| ≤ 5h (`days < 0.208`) | 1 minute | `date_trunc('minute', "startTime")` | `to_char("startTime", 'HH24:MI')` | `HH:mm` |
| ≤ 1 day (`days < 1`) | 1 hour | `date_trunc('hour', "startTime")` | `to_char(date_trunc('hour', "startTime"), 'YYYY-MM-DD HH24:MI')` | `HH:mm` |
| < 30 days (`days < 30`) | 1 day | `DATE("startTime")` | `CAST(DATE("startTime") AS TEXT)` | `MMM dd` |
| < 90 days (`days < 90`) | 2 days | `DATE("startTime") - (EXTRACT(DOY FROM "startTime")::int % 2)` | `CAST(DATE("startTime") AS TEXT)` | `MMM dd` |
| < 6 months (`days < 180`) | 1 week | `date_trunc('week', "startTime")` | `to_char(date_trunc('week', "startTime"), 'YYYY-"W"WW')` | `MMM dd` |
| < 12 months (`days < 365`) | 2 weeks | `date_trunc('week', "startTime") - INTERVAL '7 days' * (EXTRACT(WEEK FROM "startTime")::int % 2)` | `to_char(...) || ' ~' || to_char(...)` | `MMM yyyy` |
| ≥ 12 months | 1 month | `date_trunc('month', "startTime")` | `to_char(date_trunc('month', "startTime"), 'YYYY-MM')` | `MMM yyyy` |

### Lifetime auto-detection

When `days=0` (lifetime), the system queries `SELECT MIN("startTime"), MAX("startTime")` from `LiteLLM_SpendLogs` to determine the actual date range, then selects the appropriate tier.

- Result is cached for 5 minutes (the range barely changes).
- A 400-day range → biweekly grouping. A 2-year range → monthly grouping.

## Backend Design

### New file: `packages/analytics/src/queries/time-buckets.ts`

```typescript
interface TimeBucketConfig {
  minDays: number;
  maxDays: number;
  granularity: string;    // "30s" | "1m" | "1h" | "1d" | "2d" | "1w" | "2w" | "1mo"
  sqlBucket: string;      // SQL GROUP BY expression
  sqlLabel: string;       // SQL SELECT expression for date label
  displayFormat: string;  // date-fns pattern for frontend
}
```

Exports:
- `resolveTimeBucket(days: number): Promise<TimeBucketConfig>` — auto-detects range for lifetime, selects tier
- `GRANULARITY_TIERS` — the config array (for testing)

### Query migration pattern

**Before:**
```typescript
function getTimeGranularity(days) { return days < 1 ? "hour" : "day"; }
function getTimeBucketExpressions(granularity) { ... }
```

**After:**
```typescript
import { resolveTimeBucket } from "./time-buckets";

export async function getDailySpendTrend(days = 30) {
  const { sqlBucket, sqlLabel, granularity } = await resolveTimeBucket(normalizedDays);
  // ... SELECT ${sqlLabel} as "date", ... GROUP BY ${sqlBucket} ORDER BY MIN("startTime") ASC
}
```

Key change: ORDER BY uses `MIN("startTime")` instead of the label (labels for "2d" and "2w" tiers don't sort chronologically as strings).

### Queries that migrate (6 total)

| File | Query | Current grouping |
|---|---|---|
| `trend-queries.ts` | `getDailySpendTrend` | Adaptive hour/day |
| `trend-queries.ts` | `getDailyTokenTrend` | Adaptive hour/day |
| `model-queries.ts` | `getDailySpendTrendByModel` | Fixed `DATE()` |
| `model-queries.ts` | `getDailyTokenTrendByModel` | Fixed `DATE()` |
| `model-queries.ts` | `getDailyLatencyTrendByModel` | Fixed `DATE()` |
| `model-queries.ts` | `getDailyErrorTrendByModel` | Fixed `DATE()` |

### Queries that stay unchanged (4 total)

These aggregate into fixed bins (hour-of-day distribution), not timelines:
- `getHourlyUsagePatterns` — 24-hour pattern (all days collapsed)
- `getHourlyPatternDistribution` — same
- `getHourlyUsageByModel` — same (model-specific)
- `getHourlySpendTrend` — could migrate but is currently unused in frontend

### Removed functions

- `getTimeGranularity` in `trend-queries.ts`
- `getTimeBucketExpressions` in `trend-queries.ts`

### Type addition

```typescript
// packages/analytics/src/types/index.ts
interface TimeSeriesPoint {
  date: string;
  granularity: string;
}
```

Each query types its return as `Array<TimeSeriesPoint & { ...specific fields }>`.
All 6 migrated queries return `granularity` as a column in the SQL result.

## Frontend Design

### New hook: `apps/web/src/hooks/use-time-series-format.ts`

Maps granularity strings to date-fns format patterns and tick intervals:

```typescript
interface TimeSeriesFormat {
  formatX: (value: string) => string;
  formatTooltipLabel: (value: string) => string;
  tickInterval: number;
}
```

Tick intervals control axis label density (e.g., show every 10th label for 30-second buckets).

### New component: `apps/web/src/components/time-series-card.tsx`

```typescript
interface TimeSeriesCardProps {
  title: string;
  description?: string;
  data: unknown[] | undefined;
  isLoading: boolean;
  granularity?: string;
  height?: number;           // default 300
  emptyMessage?: string;
  rightYAxis?: {             // optional second Y-axis
    dataKey: string;
    name: string;
    tickFormatter?: (v: number) => string;
  };
  children: React.ReactNode; // <Area/Line/Bar> elements
}
```

Encapsulates: `<Card>` + `<CardHeader>` + `<CardContent>` + `<Skeleton>` loading + empty state + `<ResponsiveContainer>` + `<ComposedChart>` + `<CartesianGrid>` + `<XAxis>` + `<YAxis>` + `<Tooltip>` + optional right Y-axis.

Uses `ComposedChart` (not `LineChart`/`AreaChart`) so children can mix chart types freely.

### Chart migration summary (8 charts)

| Chart | Internal elements | Before | After |
|---|---|---|---|
| `DailySpendChart` | Line | ~80 lines | ~15 lines |
| `HourlyPatternChart` | Area + Line (dual Y) | ~100 lines | ~25 lines |
| `DashboardEfficiencyCharts` (token trend) | Area + Line | ~80 lines | ~20 lines |
| `ModelDetailTrendChart` | Area + Line (dual Y) | ~100 lines | ~25 lines |
| `ModelDetailCostChart` | Line + Bar | ~120 lines | ~30 lines |
| `ModelDetailLatencyChart` | 4 Lines | ~100 lines | ~25 lines |
| `ModelDetailErrorTrendChart` | Line | ~80 lines | ~15 lines |
| `ModelDetailTokenEfficiency` | Area + Line | ~100 lines | ~25 lines |

### Charts that do NOT migrate (11 total)

Non-timeline charts (PieChart, categorical BarChart, fixed-bin distributions):
- `TokenDistributionChart`, `ModelDistributionChart`, `ModelDetailStatusChart`, `ModelDetailProviderChart`, `ModelDetailTTFTChart`, `ModelDetailErrorBreakdown`, `ModelDetailHourlyChart`, `AlertsByTypeChart`, `SeverityBreakdownChart`, `ErrorsDistributionChart`, `MiniRadarChart`

## Files Changed

| Action | File | What changes |
|---|---|---|
| **New** | `packages/analytics/src/queries/time-buckets.ts` | Tier config + `resolveTimeBucket` + `getDateRange` cache |
| **Modified** | `packages/analytics/src/queries/trend-queries.ts` | Remove old granularity functions, 2 queries use `resolveTimeBucket` |
| **Modified** | `packages/analytics/src/queries/model-queries.ts` | 4 queries use `resolveTimeBucket` |
| **Modified** | `packages/analytics/src/types/index.ts` | Add `TimeSeriesPoint` |
| **New** | `apps/web/src/hooks/use-time-series-format.ts` | Format hook |
| **New** | `apps/web/src/components/time-series-card.tsx` | Base component |
| **Modified** | 8 chart components in `apps/web/src/pages/` | Migrate to `TimeSeriesCard` |

## Out of Scope

- Hourly-pattern queries (24-bin distribution)
- Non-timeline charts
- API endpoint changes (same URLs, same response shape — just `granularity` field added)
- Color system consolidation (separate concern)
- `DashboardEfficiencyCharts` model-efficiency bar chart (categorical, not timeline)
