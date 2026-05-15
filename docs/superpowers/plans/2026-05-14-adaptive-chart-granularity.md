# Adaptive Chart Granularity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixed hour/day chart grouping with 8-tier adaptive granularity (30s → 1m → 1h → 1d → 2d → 1w → 2w → 1mo) and create a reusable `TimeSeriesCard` component to eliminate boilerplate across 8 timeline charts.

**Architecture:** Config-driven tier table in backend (`time-buckets.ts`) resolves SQL bucket expressions based on day range. Lifetime mode (`days=0`) auto-detects actual data range via cached `MIN/MAX` query. Frontend receives `granularity` metadata and uses `useTimeSeriesFormat` hook + `TimeSeriesCard` component for consistent rendering.

**Tech Stack:** TypeScript, PostgreSQL (Prisma raw SQL), React 19, Recharts, date-fns

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| **New** | `packages/analytics/src/queries/time-buckets.ts` | Tier config, `resolveTimeBucket()`, `getDateRange()` cache |
| **Modify** | `packages/analytics/src/types/index.ts` | Add `TimeSeriesPoint`, update granularity type |
| **Modify** | `packages/analytics/src/queries/trend-queries.ts` | Remove old functions, 2 queries use `resolveTimeBucket` |
| **Modify** | `packages/analytics/src/queries/model-queries.ts` | 4 queries use `resolveTimeBucket` |
| **New** | `apps/web/src/hooks/use-time-series-format.ts` | Format hook mapping granularity → date-fns patterns |
| **New** | `apps/web/src/components/time-series-card.tsx` | Base chart component (Card + Skeleton + ComposedChart) |
| **Modify** | `apps/web/src/components/dashboard/dashboard-usage-charts/daily-spend-chart.tsx` | Migrate to `TimeSeriesCard` |
| **Modify** | `apps/web/src/components/dashboard/dashboard-efficiency-charts.tsx` | Extract token trend to `TimeSeriesCard` |
| **Modify** | `apps/web/src/components/model-detail/model-detail-trend-chart.tsx` | Migrate to `TimeSeriesCard` |
| **Modify** | `apps/web/src/components/model-detail/model-detail-cost-chart.tsx` | Migrate to `TimeSeriesCard` |
| **Modify** | `apps/web/src/components/model-detail/model-detail-latency-chart.tsx` | Migrate to `TimeSeriesCard` |
| **Modify** | `apps/web/src/components/model-detail/model-detail-error-trend-chart.tsx` | Migrate to `TimeSeriesCard` |
| **Modify** | `apps/web/src/components/model-detail/model-detail-token-efficiency.tsx` | Migrate to `TimeSeriesCard` |

---

### Task 1: Create `time-buckets.ts`

**Files:**
- Create: `packages/analytics/src/queries/time-buckets.ts`

- [ ] **Step 1: Create the file with tier config, resolveTimeBucket, and getDateRange**

```typescript
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
    sqlLabel:
      "to_char(date_trunc('week', \"startTime\"), 'YYYY-\"W\"WW')",
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
```

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm --filter @lite-llm/analytics typecheck`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/analytics/src/queries/time-buckets.ts
git commit -m "feat(analytics): add time-buckets config with 8-tier adaptive granularity"
```

---

### Task 2: Update types

**Files:**
- Modify: `packages/analytics/src/types/index.ts`

- [ ] **Step 1: Add `TimeSeriesPoint` interface and update granularity types**

At the top of the file (after the existing type imports), add:

```typescript
/** Granularity identifiers for time-series bucketing */
export type TimeGranularity =
  | "30s"
  | "1m"
  | "1h"
  | "1d"
  | "2d"
  | "1w"
  | "2w"
  | "1mo";

/** Base type for all time-series data points with adaptive granularity */
export interface TimeSeriesPoint {
  date: string;
  granularity: TimeGranularity;
}
```

Then update the existing `DailySpendTrend` interface (around line 107):

```typescript
export interface DailySpendTrend {
  date: string;
  spend: number;
  granularity?: TimeGranularity;
}
```

Update `DailyTokenTrend` (around line 124):

```typescript
export interface DailyTokenTrend {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
  granularity?: TimeGranularity;
}
```

Update `ModelDailySpendTrend` (around line 283):

```typescript
export interface ModelDailySpendTrend {
  date: string;
  spend: number;
  total_tokens: number;
  request_count: number;
  granularity?: TimeGranularity;
}
```

Update `ModelDailyTokenTrend` (around line 289):

```typescript
export interface ModelDailyTokenTrend {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  granularity?: TimeGranularity;
}
```

Update `ModelDailyLatencyTrend` (around line 295):

```typescript
export interface ModelDailyLatencyTrend {
  date: string;
  avg_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  granularity?: TimeGranularity;
}
```

Update `ModelDailyErrorTrend` (around line 303):

```typescript
export interface ModelDailyErrorTrend {
  date: string;
  error_count: number;
  granularity?: TimeGranularity;
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm --filter @lite-llm/analytics typecheck`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/analytics/src/types/index.ts
git commit -m "feat(analytics): add TimeSeriesPoint and TimeGranularity types"
```

---

### Task 3: Migrate `trend-queries.ts`

**Files:**
- Modify: `packages/analytics/src/queries/trend-queries.ts`

- [ ] **Step 1: Replace old granularity functions with resolveTimeBucket**

Remove the `getTimeGranularity` and `getTimeBucketExpressions` functions (lines 4-19). Replace the import to add `resolveTimeBucket`:

```typescript
import { prisma } from "./client";
import { buildWhereClause, getTimeFilterWhere, normalizeDays } from "./helpers";
import { resolveTimeBucket } from "./time-buckets";
```

- [ ] **Step 2: Update `getDailySpendTrend`**

Replace the entire function body:

```typescript
export async function getDailySpendTrend(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } = await resolveTimeBucket(normalizedDays);
  const where = buildWhereClause([getTimeFilterWhere(normalizedDays)]);

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      spend: number;
      granularity: string;
    }>
  >(`
    SELECT
      ${sqlLabel} as "date",
      COALESCE(SUM("spend"), 0)::float as "spend",
      '${granularity}' as "granularity"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY ${sqlBucket}
    ORDER BY MIN("startTime") ASC
  `);
  return result;
}
```

- [ ] **Step 3: Update `getDailyTokenTrend`**

Replace the entire function body:

```typescript
export async function getDailyTokenTrend(days = 30) {
  const normalizedDays = normalizeDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } = await resolveTimeBucket(normalizedDays);
  const where = buildWhereClause([getTimeFilterWhere(normalizedDays)]);

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      request_count: number;
      granularity: string;
    }>
  >(`
    SELECT
      ${sqlLabel} as "date",
      SUM("prompt_tokens")::float as "prompt_tokens",
      SUM("completion_tokens")::float as "completion_tokens",
      SUM("total_tokens")::float as "total_tokens",
      COUNT(*)::float as "request_count",
      '${granularity}' as "granularity"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY ${sqlBucket}
    ORDER BY MIN("startTime") ASC
  `);
  return result;
}
```

- [ ] **Step 4: Leave `getHourlySpendTrend` and `getHourlyUsagePatterns` unchanged**

These are fixed-bin (hour-of-day) queries, not timeline queries. No changes needed.

- [ ] **Step 5: Verify compilation**

Run: `pnpm --filter @lite-llm/analytics typecheck`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add packages/analytics/src/queries/trend-queries.ts
git commit -m "refactor(analytics): migrate trend queries to resolveTimeBucket"
```

---

### Task 4: Migrate `model-queries.ts`

**Files:**
- Modify: `packages/analytics/src/queries/model-queries.ts`

Add the import at the top of the file (add to existing imports from `./helpers`):

```typescript
import { resolveTimeBucket } from "./time-buckets";
```

Then update each of the 4 query functions. The pattern for each is the same:

1. Replace `DATE("startTime")::text as "date"` with `${sqlLabel} as "date"`
2. Replace `GROUP BY DATE("startTime")` with `GROUP BY ${sqlBucket}`
3. Replace `ORDER BY DATE("startTime")` with `ORDER BY MIN("startTime") ASC`
4. Add `'${granularity}' as "granularity"` to SELECT
5. Add `granularity: string` to the return type
6. Call `resolveTimeBucket(normalizedDays)` at the start

- [ ] **Step 1: Update `getDailySpendTrendByModel` (line ~162)**

Replace the function body:

```typescript
export async function getDailySpendTrendByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } = await resolveTimeBucket(normalizedDays);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      spend: number;
      total_tokens: number;
      request_count: number;
      granularity: string;
    }>
  >(`
    SELECT
      ${sqlLabel} as "date",
      SUM("spend")::float as "spend",
      SUM("total_tokens")::float as "total_tokens",
      COUNT(*)::float as "request_count",
      '${granularity}' as "granularity"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY ${sqlBucket}
    ORDER BY MIN("startTime") ASC
  `);
  return result;
}
```

- [ ] **Step 2: Update `getDailyTokenTrendByModel` (line ~190)**

Replace the function body:

```typescript
export async function getDailyTokenTrendByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } = await resolveTimeBucket(normalizedDays);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      granularity: string;
    }>
  >(`
    SELECT
      ${sqlLabel} as "date",
      SUM("prompt_tokens")::float as "prompt_tokens",
      SUM("completion_tokens")::float as "completion_tokens",
      SUM("total_tokens")::float as "total_tokens",
      '${granularity}' as "granularity"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY ${sqlBucket}
    ORDER BY MIN("startTime") ASC
  `);
  return result;
}
```

- [ ] **Step 3: Update `getDailyLatencyTrendByModel` (line ~246)**

Replace the function body:

```typescript
export async function getDailyLatencyTrendByModel(
  model: string,
  days?: number,
) {
  const normalizedDays = normalizeDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } = await resolveTimeBucket(normalizedDays);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    `"endTime" IS NOT NULL`,
    `EXTRACT(EPOCH FROM ("endTime" - "startTime")) >= 0`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{
      date: string;
      avg_latency_ms: number;
      p50_latency_ms: number;
      p95_latency_ms: number;
      p99_latency_ms: number;
      granularity: string;
    }>
  >(`
    SELECT
      ${sqlLabel} as "date",
      AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "avg_latency_ms",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p50_latency_ms",
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p95_latency_ms",
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000)::float as "p99_latency_ms",
      '${granularity}' as "granularity"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY ${sqlBucket}
    ORDER BY MIN("startTime") ASC
  `);
  return result;
}
```

**Note:** The `PERCENTILE_CONT` lines above must match the original exactly — copy from the existing function, don't retype.

- [ ] **Step 4: Update `getDailyErrorTrendByModel` (line ~309)**

Replace the function body:

```typescript
export async function getDailyErrorTrendByModel(model: string, days?: number) {
  const normalizedDays = normalizeDays(days, 30);
  const { sqlBucket, sqlLabel, granularity } = await resolveTimeBucket(normalizedDays);
  const where = `WHERE ${combineSqlConditions([
    `"model" = '${model}'`,
    `LOWER(COALESCE("status", '')) != 'success'`,
    getTimeFilterWhere(normalizedDays),
  ])}`;

  const result = await prisma.$queryRawUnsafe<
    Array<{ date: string; error_count: number; granularity: string }>
  >(`
    SELECT
      ${sqlLabel} as "date",
      COUNT(*)::float as "error_count",
      '${granularity}' as "granularity"
    FROM "LiteLLM_SpendLogs"
    ${where}
    GROUP BY ${sqlBucket}
    ORDER BY MIN("startTime") ASC
  `);
  return result;
}
```

- [ ] **Step 5: Verify compilation**

Run: `pnpm --filter @lite-llm/analytics typecheck`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add packages/analytics/src/queries/model-queries.ts
git commit -m "refactor(analytics): migrate model queries to resolveTimeBucket"
```

---

### Task 5: Update `DatabaseDataSource` return types

**Files:**
- Modify: `packages/analytics/src/data-source/database.ts` (or the relevant `-methods.ts` file)

The `DatabaseDataSource` implementation methods already call the query functions directly, so the return types will automatically include `granularity` once the query functions are updated. Verify that the data source methods don't strip the `granularity` field.

- [ ] **Step 1: Verify no data source methods strip the `granularity` field**

Search for the methods `getDailySpendTrend`, `getDailyTokenTrend`, `getDailySpendTrendByModel`, `getDailyTokenTrendByModel`, `getDailyLatencyTrendByModel`, `getDailyErrorTrendByModel` in `packages/analytics/src/data-source/`. They should simply delegate to the query functions. If any method transforms the result (e.g., strips fields), add `granularity` to the transformation.

- [ ] **Step 2: Verify compilation**

Run: `pnpm --filter @lite-llm/analytics typecheck && pnpm --filter @lite-llm/server-core typecheck`

Expected: No errors.

- [ ] **Step 3: Commit (if changes were needed)**

```bash
git add packages/analytics/src/data-source/
git commit -m "fix(analytics): preserve granularity field in data source methods"
```

---

### Task 6: Create `use-time-series-format.ts` hook

**Files:**
- Create: `apps/web/src/hooks/use-time-series-format.ts`

- [ ] **Step 1: Create the hook**

```typescript
// apps/web/src/hooks/use-time-series-format.ts
import { format, parseISO } from "date-fns";

type TimeGranularity =
  | "30s"
  | "1m"
  | "1h"
  | "1d"
  | "2d"
  | "1w"
  | "2w"
  | "1mo";

export interface TimeSeriesFormat {
  /** Format X-axis tick labels */
  formatX: (value: string) => string;
  /** Format tooltip label */
  formatTooltipLabel: (value: string) => string;
  /** Recharts interval: show every Nth tick */
  tickInterval: number;
}

const FORMAT_MAP: Record<TimeGranularity, string> = {
  "30s": "HH:mm:ss",
  "1m": "HH:mm",
  "1h": "HH:mm",
  "1d": "MMM dd",
  "2d": "MMM dd",
  "1w": "MMM dd",
  "2w": "MMM yyyy",
  "1mo": "MMM yyyy",
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

const FALLBACK_FORMAT = "MMM dd";

export function useTimeSeriesFormat(
  granularity?: string,
): TimeSeriesFormat {
  const key = (granularity ?? "1d") as TimeGranularity;
  const pattern =
    key in FORMAT_MAP ? FORMAT_MAP[key] : FALLBACK_FORMAT;
  const tickInterval =
    key in TICK_INTERVAL_MAP ? TICK_INTERVAL_MAP[key] : 1;

  const formatX = (value: string): string => {
    try {
      return format(parseISO(value), pattern);
    } catch {
      return value;
    }
  };

  const formatTooltipLabel = (value: string): string => {
    try {
      // Show more detail in tooltips
      const tooltipPattern =
        key === "1d" || key === "2d"
          ? "MMM dd, yyyy"
          : key === "1w" || key === "2w" || key === "1mo"
            ? "MMM dd, yyyy"
            : pattern;
      return format(parseISO(value), tooltipPattern);
    } catch {
      return value;
    }
  };

  return { formatX, formatTooltipLabel, tickInterval };
}
```

- [ ] **Step 2: Verify compilation**

Run: `pnpm --filter @lite-llm/web-app typecheck 2>&1 | head -5`

Expected: No errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/use-time-series-format.ts
git commit -m "feat(web): add useTimeSeriesFormat hook for adaptive chart labels"
```

---

### Task 7: Create `TimeSeriesCard` component

**Files:**
- Create: `apps/web/src/components/time-series-card.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/time-series-card.tsx
import type { ReactNode } from "react";
import {
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTimeSeriesFormat } from "../hooks/use-time-series-format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ChartTooltipContent } from "./ui/chart-tooltip";
import { Skeleton } from "./ui/skeleton";

interface RightYAxisConfig {
  dataKey: string;
  name: string;
  tickFormatter?: (value: number) => string;
}

interface TimeSeriesCardProps {
  title: string;
  description?: string;
  data: unknown[] | undefined;
  isLoading: boolean;
  granularity?: string;
  height?: number;
  emptyMessage?: string;
  rightYAxis?: RightYAxisConfig;
  formatY?: (value: number) => string;
  formatYRight?: (value: number) => string;
  children: ReactNode;
}

export function TimeSeriesCard({
  title,
  description,
  data,
  isLoading,
  granularity,
  height = 300,
  emptyMessage = "No data available",
  rightYAxis,
  formatY,
  formatYRight,
  children,
}: TimeSeriesCardProps) {
  const { formatX, formatTooltipLabel, tickInterval } =
    useTimeSeriesFormat(granularity);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data?.length ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatX}
                interval={tickInterval}
                minTickGap={50}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatY}
                allowDecimals={false}
              />
              {rightYAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={formatYRight}
                />
              )}
              <Tooltip
                content={<ChartTooltipContent />}
                labelFormatter={formatTooltipLabel}
              />
              {children}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `pnpm --filter @lite-llm/web-app typecheck 2>&1 | head -5`

Expected: No errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/time-series-card.tsx
git commit -m "feat(web): add TimeSeriesCard reusable chart component"
```

---

### Task 8: Migrate `DailySpendChart`

**Files:**
- Modify: `apps/web/src/components/dashboard/dashboard-usage-charts/daily-spend-chart.tsx`

This is the simplest migration — validates the pattern works end-to-end.

- [ ] **Step 1: Rewrite the component using TimeSeriesCard**

```tsx
// apps/web/src/components/dashboard/dashboard-usage-charts/daily-spend-chart.tsx
import { Line } from "recharts";
import type { DailyTrendItem } from "../../../pages/dashboard/dashboard-types";
import { formatCurrency } from "../../../pages/dashboard/dashboard-utils";
import { CHART_COLORS } from "../../../lib/chart-colors";
import { TimeSeriesCard } from "../../time-series-card";

type DailySpendChartProps = {
  data: DailyTrendItem[];
  loading: boolean;
  rangeLabel: string;
};

export function DailySpendChart({
  data,
  loading,
  rangeLabel,
}: DailySpendChartProps) {
  const granularity = data?.[0]?.granularity;

  return (
    <TimeSeriesCard
      title={`Daily Spend Trend (${rangeLabel})`}
      data={data}
      isLoading={loading}
      granularity={granularity}
      formatY={(v) => `$${v}`}
    >
      <Line
        type="monotone"
        dataKey="spend"
        stroke={CHART_COLORS[0]}
        strokeWidth={2}
        dot={false}
        connectNulls
        name="Spend"
      />
    </TimeSeriesCard>
  );
}
```

- [ ] **Step 2: Verify the dashboard renders with `pnpm dev`**

Run: `pnpm dev` and open http://localhost:5178, select different time ranges (15m, 7d, 30d, lifetime). Verify the Daily Spend chart renders correctly with appropriate x-axis labels for each range.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/dashboard-usage-charts/daily-spend-chart.tsx
git commit -m "refactor(web): migrate DailySpendChart to TimeSeriesCard"
```

---

### Task 9: Migrate `ModelDetailErrorTrendChart`

**Files:**
- Modify: `apps/web/src/components/model-detail/model-detail-error-trend-chart.tsx`

- [ ] **Step 1: Rewrite the component using TimeSeriesCard**

```tsx
// apps/web/src/components/model-detail/model-detail-error-trend-chart.tsx
import { Line } from "recharts";
import type { ModelDailyErrorTrend } from "../../../packages/analytics/src/types/index";
import {
  CHART_HEIGHT,
  formatNumber,
} from "../../pages/model-detail/model-detail-utils";
import { CHART_COLORS } from "../../lib/chart-colors";
import { TimeSeriesCard } from "../time-series-card";

type Props = {
  data: ModelDailyErrorTrend[];
  loading: boolean;
  rangeLabel?: string;
};

export function ModelDetailErrorTrendChart({
  data,
  loading,
  rangeLabel,
}: Props) {
  const granularity = data?.[0]?.granularity;

  return (
    <TimeSeriesCard
      title={`Error Trend${rangeLabel ? ` (${rangeLabel})` : ""}`}
      data={data}
      isLoading={loading}
      granularity={granularity}
      height={CHART_HEIGHT}
      emptyMessage="No error trend data available"
      formatY={(v) => formatNumber(Number(v))}
    >
      <Line
        type="monotone"
        dataKey="errorCount"
        name="Error Count"
        stroke={CHART_COLORS[3]}
        strokeWidth={2}
        dot={false}
      />
    </TimeSeriesCard>
  );
}
```

**Important:** Verify the import path for `ModelDailyErrorTrend`. Check the current component's import and use the same path. If it imports from a local types file, keep that import.

- [ ] **Step 2: Verify compilation**

Run: `pnpm --filter @lite-llm/web-app typecheck 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/model-detail/model-detail-error-trend-chart.tsx
git commit -m "refactor(web): migrate ModelDetailErrorTrendChart to TimeSeriesCard"
```

---

### Task 10: Migrate `ModelDetailTrendChart` (dual Y-axis)

**Files:**
- Modify: `apps/web/src/components/model-detail/model-detail-trend-chart.tsx`

This validates the `rightYAxis` prop.

- [ ] **Step 1: Rewrite the component using TimeSeriesCard**

```tsx
// apps/web/src/components/model-detail/model-detail-trend-chart.tsx
import { Area, Legend, Line } from "recharts";
import type { ModelDailySpendTrend } from "../../pages/model-detail/model-detail-types";
import { CHART_HEIGHT, formatCurrency, formatNumber } from "../../pages/model-detail/model-detail-utils";
import { CHART_COLORS } from "../../lib/chart-colors";
import { TimeSeriesCard } from "../time-series-card";

type Props = {
  data: ModelDailySpendTrend[];
  loading: boolean;
  rangeLabel?: string;
};

export function ModelDetailTrendChart({ data, loading, rangeLabel }: Props) {
  const granularity = data?.[0]?.granularity;

  return (
    <TimeSeriesCard
      title={`Spend & Requests Trend${rangeLabel ? ` (${rangeLabel})` : ""}`}
      data={data}
      isLoading={loading}
      granularity={granularity}
      height={CHART_HEIGHT}
      emptyMessage="No trend data available"
      formatY={formatNumber}
      rightYAxis={{
        dataKey: "spend",
        name: "Spend",
        tickFormatter: (v) => formatCurrency(Number(v)),
      }}
      formatYRight={(v) => formatCurrency(Number(v))}
    >
      <Legend />
      <Area
        type="monotone"
        dataKey="requestCount"
        name="Requests"
        yAxisId="left"
        stroke={CHART_COLORS[4]}
        fill={CHART_COLORS[4]}
        fillOpacity={0.3}
      />
      <Line
        type="monotone"
        dataKey="spend"
        name="Spend"
        yAxisId="right"
        stroke={CHART_COLORS[1]}
        strokeWidth={2}
        dot={false}
      />
    </TimeSeriesCard>
  );
}
```

**Note:** Verify the data key names (`requestCount` vs `request_count`) match what the API returns. The model-detail hook transforms snake_case to camelCase, so use `requestCount`.

- [ ] **Step 2: Verify the dual Y-axis renders correctly**

Run: `pnpm dev`, navigate to a model detail page, check that both Y-axes render with correct formatting.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/model-detail/model-detail-trend-chart.tsx
git commit -m "refactor(web): migrate ModelDetailTrendChart to TimeSeriesCard with dual Y-axis"
```

---

### Task 11: Migrate `ModelDetailLatencyChart` (multi-line)

**Files:**
- Modify: `apps/web/src/components/model-detail/model-detail-latency-chart.tsx`

- [ ] **Step 1: Rewrite using TimeSeriesCard**

```tsx
// apps/web/src/components/model-detail/model-detail-latency-chart.tsx
import { Legend, Line } from "recharts";
import type { ModelDailyLatencyTrend } from "../../pages/model-detail/model-detail-types";
import { CHART_HEIGHT, formatDuration } from "../../pages/model-detail/model-detail-utils";
import { CHART_COLORS } from "../../lib/chart-colors";
import { TimeSeriesCard } from "../time-series-card";

type Props = {
  data: ModelDailyLatencyTrend[];
  loading: boolean;
  rangeLabel?: string;
};

export function ModelDetailLatencyChart({ data, loading, rangeLabel }: Props) {
  const granularity = data?.[0]?.granularity;

  return (
    <TimeSeriesCard
      title={`Latency Trend${rangeLabel ? ` (${rangeLabel})` : ""}`}
      data={data}
      isLoading={loading}
      granularity={granularity}
      height={CHART_HEIGHT}
      emptyMessage="No latency data available"
      formatY={(v) => formatDuration(Number(v))}
    >
      <Legend />
      <Line type="monotone" dataKey="avgLatencyMs" name="Avg" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
      <Line type="monotone" dataKey="p50LatencyMs" name="P50" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
      <Line type="monotone" dataKey="p95LatencyMs" name="P95" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
      <Line type="monotone" dataKey="p99LatencyMs" name="P99" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} />
    </TimeSeriesCard>
  );
}
```

**Note:** Verify the data key names. The model-detail hook may transform `avg_latency_ms` → `avgLatencyMs`. Check the current component's data keys and match them.

- [ ] **Step 2: Verify compilation and commit**

```bash
pnpm --filter @lite-llm/web-app typecheck 2>&1 | head -5
git add apps/web/src/components/model-detail/model-detail-latency-chart.tsx
git commit -m "refactor(web): migrate ModelDetailLatencyChart to TimeSeriesCard"
```

---

### Task 12: Migrate `ModelDetailCostChart` (two sub-charts)

**Files:**
- Modify: `apps/web/src/components/model-detail/model-detail-cost-chart.tsx`

This component renders two cards: a Line chart for cost trend and a Bar chart for cost per million tokens. Both use time-series data, so both use `TimeSeriesCard`.

- [ ] **Step 1: Rewrite using TimeSeriesCard**

```tsx
// apps/web/src/components/model-detail/model-detail-cost-chart.tsx
import { Bar, Line, Legend } from "recharts";
import type { ModelDailySpendTrend } from "../../pages/model-detail/model-detail-types";
import { CHART_HEIGHT, formatCurrency } from "../../pages/model-detail/model-detail-utils";
import { CHART_COLORS } from "../../lib/chart-colors";
import { TimeSeriesCard } from "../time-series-card";

type Props = {
  data: ModelDailySpendTrend[];
  loading: boolean;
  rangeLabel: string;
};

export function ModelDetailCostChart({ data, loading, rangeLabel }: Props) {
  const granularity = data?.[0]?.granularity;

  const costPerTokenData = data.map((item) => ({
    ...item,
    costPerMTokens:
      item.totalTokens > 0 ? (item.spend / item.totalTokens) * 1_000_000 : 0,
  }));

  return (
    <>
      <TimeSeriesCard
        title={`Cost Trend${rangeLabel ? ` (${rangeLabel})` : ""}`}
        data={data}
        isLoading={loading}
        granularity={granularity}
        height={CHART_HEIGHT}
        emptyMessage="No cost data available"
        formatY={(v) => formatCurrency(Number(v))}
      >
        <Line
          type="monotone"
          dataKey="spend"
          name="Spend"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={false}
        />
      </TimeSeriesCard>

      <TimeSeriesCard
        title={`Cost per Million Tokens${rangeLabel ? ` (${rangeLabel})` : ""}`}
        data={costPerTokenData}
        isLoading={loading}
        granularity={granularity}
        height={CHART_HEIGHT}
        emptyMessage="No cost data available"
        formatY={(v) => formatCurrency(Number(v))}
      >
        <Bar
          dataKey="costPerMTokens"
          name="Cost/M tokens"
          fill={CHART_COLORS[0]}
          radius={[4, 4, 0, 0]}
        />
      </TimeSeriesCard>
    </>
  );
}
```

**Note:** Verify that `totalTokens` matches the data key name in the transformed data (camelCase).

- [ ] **Step 2: Verify compilation and commit**

```bash
pnpm --filter @lite-llm/web-app typecheck 2>&1 | head -5
git add apps/web/src/components/model-detail/model-detail-cost-chart.tsx
git commit -m "refactor(web): migrate ModelDetailCostChart to TimeSeriesCard"
```

---

### Task 13: Migrate `ModelDetailTokenEfficiency` (two sub-charts)

**Files:**
- Modify: `apps/web/src/components/model-detail/model-detail-token-efficiency.tsx`

Two sub-charts: Token Usage Breakdown (AreaChart) and Input/Output Ratio (LineChart). Both time-series.

- [ ] **Step 1: Rewrite using TimeSeriesCard**

```tsx
// apps/web/src/components/model-detail/model-detail-token-efficiency.tsx
import { Area, Line, Legend } from "recharts";
import type { ModelDailyTokenTrend } from "../../pages/model-detail/model-detail-types";
import { CHART_HEIGHT, formatNumber } from "../../pages/model-detail/model-detail-utils";
import { CHART_COLORS } from "../../lib/chart-colors";
import { TimeSeriesCard } from "../time-series-card";

type Props = {
  data: ModelDailyTokenTrend[];
  loading: boolean;
  rangeLabel: string;
};

export function ModelDetailTokenEfficiency({
  data,
  loading,
  rangeLabel,
}: Props) {
  const granularity = data?.[0]?.granularity;

  const ratioData = data.map((item) => ({
    ...item,
    inputOutputRatio:
      item.completionTokens > 0
        ? item.promptTokens / item.completionTokens
        : item.promptTokens > 0
          ? Infinity
          : 0,
  }));

  return (
    <>
      <TimeSeriesCard
        title={`Token Usage Breakdown${rangeLabel ? ` (${rangeLabel})` : ""}`}
        data={data}
        isLoading={loading}
        granularity={granularity}
        height={CHART_HEIGHT}
        emptyMessage="No token data available"
        formatY={formatNumber}
      >
        <Legend />
        <Area
          type="monotone"
          dataKey="promptTokens"
          name="Input Tokens"
          stackId="1"
          stroke={CHART_COLORS[0]}
          fill={CHART_COLORS[0]}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="completionTokens"
          name="Output Tokens"
          stackId="1"
          stroke={CHART_COLORS[3]}
          fill={CHART_COLORS[3]}
          fillOpacity={0.6}
        />
      </TimeSeriesCard>

      <TimeSeriesCard
        title={`Input/Output Ratio${rangeLabel ? ` (${rangeLabel})` : ""}`}
        data={ratioData}
        isLoading={loading}
        granularity={granularity}
        height={CHART_HEIGHT}
        emptyMessage="No token data available"
        formatY={(v) => `${Number(v).toFixed(1)}x`}
      >
        <Line
          type="monotone"
          dataKey="inputOutputRatio"
          name="Input/Output Ratio"
          stroke={CHART_COLORS[4]}
          strokeWidth={2}
          dot={false}
        />
      </TimeSeriesCard>
    </>
  );
}
```

**Note:** Verify the data key names. The model-detail hook transforms snake_case → camelCase: `prompt_tokens` → `promptTokens`, `completion_tokens` → `completionTokens`.

- [ ] **Step 2: Verify compilation and commit**

```bash
pnpm --filter @lite-llm/web-app typecheck 2>&1 | head -5
git add apps/web/src/components/model-detail/model-detail-token-efficiency.tsx
git commit -m "refactor(web): migrate ModelDetailTokenEfficiency to TimeSeriesCard"
```

---

### Task 14: Migrate `DashboardEfficiencyCharts` (extract timeline charts)

**Files:**
- Modify: `apps/web/src/components/dashboard/dashboard-efficiency-charts.tsx`

This is the most complex migration. The component has 4 charts, but only the **Token Trend** and **Tokens per Request** are timeline-based. The Model Efficiency bar chart and the Efficiency vs Speed scatter chart are NOT timeline and stay as-is.

Strategy: Replace only the timeline chart sections with `TimeSeriesCard`, keeping the categorical charts unchanged.

- [ ] **Step 1: Add import for TimeSeriesCard and useTimeSeriesFormat**

Add to the imports at the top of the file:

```typescript
import { TimeSeriesCard } from "../time-series-card";
import { useTimeSeriesFormat } from "../../hooks/use-time-series-format";
```

Remove the now-unused imports that `TimeSeriesCard` handles (check which ones become unused after the migration).

- [ ] **Step 2: Replace the Token Trend `<Card>` block**

Find the second `<Card>` in the component (the one with `<CardTitle>Token Trend`) and replace it with:

```tsx
<TimeSeriesCard
  title={`Token Trend (${rangeLabel})`}
  data={dailyTokenTrend}
  isLoading={loading}
  granularity={dailyTokenTrend?.[0]?.granularity}
  formatY={formatNumber}
>
  <Legend />
  <Area type="monotone" dataKey="prompt_tokens" name="Input" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
  <Area type="monotone" dataKey="completion_tokens" name="Output" stackId="1" stroke="#10b981" fill="#10b981" />
  <Line type="monotone" dataKey="total_tokens" name="Total" stroke="#f59e0b" strokeWidth={2} dot={false} />
</TimeSeriesCard>
```

**Note:** `dailyTokenTrend` uses snake_case keys from the API (not camelCase). The data keys are `prompt_tokens`, `completion_tokens`, `total_tokens`.

- [ ] **Step 3: Replace the Tokens per Request `<Card>` block**

Find the third `<Card>` (the one with `<CardTitle>Tokens por Request`) and replace it with:

```tsx
<TimeSeriesCard
  title={`Tokens por Request ao Longo do Tempo (${rangeLabel})`}
  data={tokensPerRequestData}
  isLoading={loading}
  granularity={dailyTokenTrend?.[0]?.granularity}
  formatY={formatNumber}
  rightYAxis={{
    dataKey: "request_count",
    name: "Requests",
    tickFormatter: formatNumber,
  }}
  formatYRight={formatNumber}
>
  <Legend />
  <Bar
    yAxisId="left"
    dataKey="tokens_per_request"
    name="Tokens / Request"
    fill="#8b5cf6"
    barSize={barSize}
    radius={[4, 4, 0, 0]}
  />
  <Line
    yAxisId="right"
    type="monotone"
    dataKey="request_count"
    name="Requests"
    stroke="#f59e0b"
    strokeWidth={2}
    dot={false}
  />
</TimeSeriesCard>
```

- [ ] **Step 4: Clean up unused imports**

After the migration, remove any Recharts imports that are no longer directly used in this file (they're now handled by `TimeSeriesCard`). Keep imports used by the remaining charts (Model Efficiency bar, Scatter chart).

The file should still import: `Bar`, `BarChart`, `LabelList`, `Legend`, `Scatter`, `ScatterChart`, `XAxis`, `YAxis` (for the non-timeline charts), plus `Area`, `Line` (for the TimeSeriesCard children), and `useMemo`.

Remove `CartesianGrid`, `ResponsiveContainer`, `Tooltip` from this file's Recharts imports since `TimeSeriesCard` handles those. Also remove `Skeleton` import if no longer used directly.

- [ ] **Step 5: Verify compilation and visual rendering**

```bash
pnpm --filter @lite-llm/web-app typecheck
```

Then run `pnpm dev`, go to the Dashboard, switch to the Efficiency tab, and verify all 4 charts render correctly.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/dashboard/dashboard-efficiency-charts.tsx
git commit -m "refactor(web): migrate DashboardEfficiencyCharts timeline charts to TimeSeriesCard"
```

---

### Task 15: Update frontend types for granularity

**Files:**
- Modify: `apps/web/src/pages/dashboard/dashboard-types.ts`
- Modify: `apps/web/src/pages/model-detail/model-detail-types.ts`

The dashboard and model-detail type files define local types that mirror the backend types. Update them to include `granularity`.

- [ ] **Step 1: Update `dashboard-types.ts`**

Find the `DailyTrendItem` type and update it:

```typescript
export type DailyTrendItem = {
  date: string;
  spend: number;
  granularity?: "30s" | "1m" | "1h" | "1d" | "2d" | "1w" | "2w" | "1mo";
};
```

Find the `DailyTokenTrendItem` type and update it:

```typescript
export type DailyTokenTrendItem = {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
  granularity?: "30s" | "1m" | "1h" | "1d" | "2d" | "1w" | "2w" | "1mo";
};
```

- [ ] **Step 2: Update `model-detail-types.ts`**

Find and update the model-detail trend types to include `granularity`:

```typescript
export interface ModelDailySpendTrend {
  date: string;
  spend: number;
  totalTokens: number;
  requestCount: number;
  granularity?: string;
}

export interface ModelDailyTokenTrend {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  granularity?: string;
}

export interface ModelDailyLatencyTrend {
  date: string;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  granularity?: string;
}

export interface ModelDailyErrorTrend {
  date: string;
  errorCount: number;
  granularity?: string;
}
```

- [ ] **Step 3: Verify compilation**

```bash
pnpm --filter @lite-llm/web-app typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/dashboard/dashboard-types.ts apps/web/src/pages/model-detail/model-detail-types.ts
git commit -m "feat(web): add granularity field to frontend time-series types"
```

---

### Task 16: End-to-end verification

- [ ] **Step 1: Run full typecheck**

```bash
pnpm typecheck
```

Expected: No errors across all packages.

- [ ] **Step 2: Start dev server and verify all chart pages**

```bash
pnpm dev
```

Open http://localhost:5178 and test:

1. **Dashboard** — switch between all time ranges (15m, 1h, 5h, 12h, 24h, 7d, 14d, 30d, lifetime). Verify:
   - Daily Spend chart shows appropriate x-axis labels for each range
   - Token Trend chart (Efficiency tab) shows appropriate labels
   - No console errors

2. **Model Detail** — navigate to a model's detail page. Verify:
   - Spend & Requests trend chart renders
   - Cost charts render
   - Latency chart renders
   - Error trend chart renders
   - Token efficiency charts render

3. **Lifetime range** — select lifetime on dashboard. Verify charts render with monthly/quarterly labels (not hundreds of daily points).

- [ ] **Step 3: Run existing tests**

```bash
pnpm test
```

Expected: All existing tests pass (no test changes needed — this is a refactor with same external behavior).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: adaptive chart granularity — full typecheck and integration verification"
```

---

## Notes

- **`HourlyPatternChart` does NOT migrate** — it's a 24-bin distribution chart, not a timeline.
- **`ModelDetailHourlyChart` does NOT migrate** — same reason (hour-of-day distribution).
- **Model Efficiency bar and Scatter charts in `DashboardEfficiencyCharts` do NOT migrate** — they are categorical, not time-series.
- **`DashboardDateRangeKey` already includes `"lifetime"`** from prior work. The lifetime mode triggers `days=0` which auto-detects the actual range via `getDateRange()`.
- The `getHourlySpendTrend` function in `trend-queries.ts` remains unchanged — it's used for specific hourly views, not the adaptive time-series charts.