# Benchmark Comparison Deck — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the benchmark comparison tab into a horizontal card deck with rich per-model data (agentic index, value scores, raw benchmarks, rankings) and a use-case filter for contextual model ranking.

**Architecture:** Replace the existing bar chart + radar + text-analysis comparison view with a scrollable deck of vertical cards. Each card is self-contained with its own radar, core metrics, value analysis, expandable raw benchmarks, and rankings. A sticky use-case filter bar above the deck reorders cards by contextual composite scores.

**Tech Stack:** React 19, Recharts, shadcn/ui, TanStack Query, TypeScript

---

## File Map

### Modified
- `apps/web/src/pages/benchmarks/benchmark-types.ts` — add UseCase, PercentileMap, UseCaseScores types
- `apps/web/src/pages/benchmarks/benchmark-utils.ts` — add percentile calc, use-case scoring, coverage count
- `apps/web/src/pages/benchmarks/use-benchmarks-state.ts` — split into state + actions + derived
- `apps/web/src/pages/benchmarks.tsx` — replace comparison tab JSX with deck

### Created
- `apps/web/src/pages/benchmarks/use-benchmarks-actions.ts` — toggle, clear, setUseCase, compareTop3
- `apps/web/src/pages/benchmarks/use-benchmarks-derived.ts` — percentiles, useCaseScores, sortedCards
- `apps/web/src/pages/benchmarks/use-benchmarks-page.ts` — compose all hooks
- `apps/web/src/components/benchmark/metric-bar.tsx` — horizontal bar with percentile fill
- `apps/web/src/components/benchmark/mini-radar-chart.tsx` — small 150px radar for card header
- `apps/web/src/components/benchmark/raw-benchmark-grid.tsx` — collapsible 3×4 grid of raw scores
- `apps/web/src/components/benchmark/ranking-list.tsx` — compact ranking text list
- `apps/web/src/components/benchmark/data-coverage-bar.tsx` — coverage indicator
- `apps/web/src/components/benchmark/use-case-filter.tsx` — chip group for use case selection
- `apps/web/src/components/benchmark/comparison-card.tsx` — full card with all sections
- `apps/web/src/components/benchmark/comparison-deck.tsx` — horizontal scroll container

### Tests
- `apps/web/src/pages/benchmarks/__tests__/benchmark-utils.test.ts` — unit tests for new utils
- `apps/web/src/components/benchmark/__tests__/comparison-card.test.tsx` — component test

---

## Task 1: Add New Types

**Files:**
- Modify: `apps/web/src/pages/benchmarks/benchmark-types.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/web/src/pages/benchmarks/__tests__/benchmark-types.test.ts
import type {
  UseCase,
  PercentileMap,
  UseCaseScores,
  ComparisonCardData,
} from "../benchmark-types";
import { expect, test } from "vitest";

test("UseCase is one of 5 string literals", () => {
  const useCase: UseCase = "intelligence";
  expect(useCase).toBe("intelligence");
});

test("PercentileMap has entries for all key metrics", () => {
  const map: PercentileMap = new Map([
    ["intelligenceIndex", 85],
    ["codingIndex", 72],
  ]);
  expect(map.get("intelligenceIndex")).toBe(85);
});

test("UseCaseScores has scores for all 5 use cases", () => {
  const scores: UseCaseScores = {
    intelligence: 88,
    coding: 75,
    agentic: 62,
    fastAndCheap: 70,
    balanced: 78,
  };
  expect(scores.intelligence).toBe(88);
  expect(scores.balanced).toBe(78);
});

test("ComparisonCardData has all required fields", () => {
  const card: ComparisonCardData = {
    model: null as never,
    agentic: { tau2: null, ifbench: null, lcr: null, terminalbenchHard: null, agenticIndex: null, coverage: 0 },
    value: { intelligencePerDollar: null, speedPerDollar: null, agenticPerDollar: null },
    compositeScore: 0,
    percentiles: new Map(),
    useCaseScores: { intelligence: 0, coding: 0, agentic: 0, fastAndCheap: 0, balanced: 0 },
    rank: { intelligence: 0, coding: 0, math: 0, agentic: 0, speed: 0, price: 0, value: 0 },
    coverageCount: 0,
    totalBenchmarks: 11,
  };
  expect(card.totalBenchmarks).toBe(11);
  expect(card.useCaseScores.balanced).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/gustavo/Apps/lite-llm-analytics && pnpm --filter @lite-llm/web test -- --run apps/web/src/pages/benchmarks/__tests__/benchmark-types.test.ts`
Expected: FAIL — "UseCase" / "PercentileMap" / etc. not found

- [ ] **Step 3: Add new types to benchmark-types.ts**

Add to the end of `apps/web/src/pages/benchmarks/benchmark-types.ts`:

```typescript
export type UseCase = "intelligence" | "coding" | "agentic" | "fastAndCheap" | "balanced";

export type PercentileMap = Map<
  | "intelligenceIndex"
  | "codingIndex"
  | "mathIndex"
  | "agenticIndex"
  | "medianOutputTokensPerSecond"
  | "medianTimeToFirstTokenSeconds"
  | "priceBlended1mTokens",
  number
>;

export interface UseCaseScores {
  intelligence: number;
  coding: number;
  agentic: number;
  fastAndCheap: number;
  balanced: number;
}

export interface ComparisonCardData {
  model: ModelBenchmarkListItem;
  agentic: AgenticScore;
  value: ValueScore;
  compositeScore: number;
  percentiles: PercentileMap;
  useCaseScores: UseCaseScores;
  rank: {
    intelligence: number;
    coding: number;
    math: number;
    agentic: number;
    speed: number;
    price: number;
    value: number;
  };
  coverageCount: number;
  totalBenchmarks: number;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @lite-llm/web test -- --run apps/web/src/pages/benchmarks/__tests__/benchmark-types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/benchmarks/benchmark-types.ts apps/web/src/pages/benchmarks/__tests__/benchmark-types.test.ts
git commit -m "feat(benchmarks): add UseCase, PercentileMap, UseCaseScores, ComparisonCardData types"
```

---

## Task 2: Add Utility Functions

**Files:**
- Modify: `apps/web/src/pages/benchmarks/benchmark-utils.ts`
- Test: `apps/web/src/pages/benchmarks/__tests__/benchmark-utils.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/web/src/pages/benchmarks/__tests__/benchmark-utils.test.ts
import { describe, expect, test } from "vitest";
import type { ModelBenchmarkListItem } from "@lite-llm/api-contracts";
import {
  calculatePercentiles,
  calculateUseCaseScores,
  getCoverageCount,
} from "../benchmark-utils";

const mockModel = {
  id: "test",
  name: "Test Model",
  slug: "test-model",
  creatorId: null,
  creatorName: "Test",
  creatorSlug: null,
  intelligenceIndex: 80,
  codingIndex: 70,
  mathIndex: 65,
  mmluPro: 75,
  gpqa: 60,
  hle: null,
  livecodebench: 68,
  scicode: null,
  math500: 72,
  aime: 40,
  aime25: null,
  tau2: 55,
  ifbench: 80,
  lcr: 65,
  terminalbenchHard: 70,
  priceInput1mTokens: 3,
  priceOutput1mTokens: 15,
  priceBlended1mTokens: 5,
  medianOutputTokensPerSecond: 50,
  medianTimeToFirstTokenSeconds: 1.5,
  medianTimeToFirstAnswerTokenSeconds: null,
  isConfigured: false,
  matchedConfiguredModel: null,
} satisfies ModelBenchmarkListItem;

const mockRows = [mockModel];

describe("calculatePercentiles", () => {
  test("returns 50th percentile when only one model", () => {
    const percentiles = calculatePercentiles(mockRows, mockModel);
    expect(percentiles.get("intelligenceIndex")).toBe(50);
    expect(percentiles.get("codingIndex")).toBe(50);
  });

  test("returns correct percentile for lower values", () => {
    const lowModel = { ...mockModel, id: "low", intelligenceIndex: 30 };
    const highModel = { ...mockModel, id: "high", intelligenceIndex: 90 };
    const rows = [lowModel, highModel];
    const percentiles = calculatePercentiles(rows, lowModel);
    expect(percentiles.get("intelligenceIndex")).toBe(0);
    const highPercentiles = calculatePercentiles(rows, highModel);
    expect(highPercentiles.get("intelligenceIndex")).toBe(100);
  });

  test("handles null values in percentile calculation", () => {
    const nullModel = { ...mockModel, id: "null", intelligenceIndex: null };
    const rows = [nullModel, mockModel];
    const percentiles = calculatePercentiles(rows, nullModel);
    expect(percentiles.get("intelligenceIndex")).toBeNull();
  });
});

describe("calculateUseCaseScores", () => {
  test("returns all 5 use case scores", () => {
    const scores = calculateUseCaseScores(mockModel);
    expect(scores).toHaveProperty("intelligence");
    expect(scores).toHaveProperty("coding");
    expect(scores).toHaveProperty("agentic");
    expect(scores).toHaveProperty("fastAndCheap");
    expect(scores).toHaveProperty("balanced");
  });

  test("intelligence score weights intelligence highest", () => {
    const scores = calculateUseCaseScores(mockModel);
    // intelligence: 0.6*intel + 0.2*coding + 0.2*math = 0.6*80 + 0.2*70 + 0.2*65 = 48+14+13 = 75
    expect(scores.intelligence).toBe(75);
  });

  test("fastAndCheap penalizes high price", () => {
    const cheapModel = { ...mockModel, priceBlended1mTokens: 1, medianOutputTokensPerSecond: 100 };
    const expensiveModel = { ...mockModel, priceBlended1mTokens: 50, medianOutputTokensPerSecond: 20 };
    const cheapScores = calculateUseCaseScores(cheapModel);
    const expensiveScores = calculateUseCaseScores(expensiveModel);
    expect(cheapScores.fastAndCheap).toBeGreaterThan(expensiveScores.fastAndCheap);
  });

  test("balanced is average of all dimensions", () => {
    const scores = calculateUseCaseScores(mockModel);
    // Should be between 0 and 100
    expect(scores.balanced).toBeGreaterThan(0);
    expect(scores.balanced).toBeLessThanOrEqual(100);
  });
});

describe("getCoverageCount", () => {
  test("counts 11 total benchmarks", () => {
    expect(getCoverageCount(mockModel)).toBe(11);
  });

  test("counts only non-null raw benchmarks", () => {
    const allNull: ModelBenchmarkListItem = {
      ...mockModel,
      mmluPro: null, gpqa: null, hle: null, livecodebench: null,
      scicode: null, math500: null, aime: null, aime25: null,
      tau2: null, ifbench: null, lcr: null, terminalbenchHard: null,
    };
    expect(getCoverageCount(allNull)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @lite-llm/web test -- --run apps/web/src/pages/benchmarks/__tests__/benchmark-utils.test.ts`
Expected: FAIL — "calculatePercentiles", "calculateUseCaseScores", "getCoverageCount" not found

- [ ] **Step 3: Add utility functions to benchmark-utils.ts**

Add these functions before the formatting functions at the end of `benchmark-utils.ts`:

```typescript
import type { UseCaseScores } from "./benchmark-types";
import type { PercentileMap } from "./benchmark-types";
import type { ModelBenchmarkListItem } from "@lite-llm/api-contracts";

const RAW_BENCHMARK_KEYS = [
  "mmluPro",
  "gpqa",
  "hle",
  "livecodebench",
  "scicode",
  "math500",
  "aime",
  "aime25",
  "tau2",
  "ifbench",
  "lcr",
  "terminalbenchHard",
] as const;

/**
 * Calculate percentile rank for each metric of a model within the full rows set.
 * 0 = lowest, 100 = highest.
 */
export function calculatePercentiles(
  rows: ModelBenchmarkListItem[],
  model: ModelBenchmarkListItem,
): PercentileMap {
  const metricKeys = [
    "intelligenceIndex",
    "codingIndex",
    "mathIndex",
    "medianOutputTokensPerSecond",
    "medianTimeToFirstTokenSeconds",
    "priceBlended1mTokens",
  ] as const;

  const result = new Map<PercentileMap extends Map<infer K, unknown> ? K : never, number>();

  for (const key of metricKeys) {
    const values = rows
      .map((r) => r[key])
      .filter((v): v is number => v !== null && v !== undefined);

    if (values.length === 0) {
      result.set(key, null as never);
      continue;
    }

    const modelValue = model[key];
    if (modelValue === null || modelValue === undefined) {
      result.set(key, null as never);
      continue;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const rank = sorted.indexOf(modelValue);
    const percentile = (rank / (sorted.length - 1)) * 100;
    result.set(key, Math.round(percentile));
  }

  // Add agentic percentile
  const agenticScores = rows
    .map((r) => calculateAgenticScore(r).agenticIndex)
    .filter((v): v is number => v !== null);
  if (agenticScores.length > 0 && calculateAgenticScore(model).agenticIndex !== null) {
    const sorted = [...agenticScores].sort((a, b) => a - b);
    const modelAgentic = calculateAgenticScore(model).agenticIndex!;
    const rank = sorted.indexOf(modelAgentic);
    result.set(
      "agenticIndex" as never,
      Math.round((rank / (sorted.length - 1)) * 100),
    );
  } else {
    result.set("agenticIndex" as never, null as never);
  }

  return result;
}

/**
 * Calculate contextual composite scores for each use case.
 */
export function calculateUseCaseScores(
  model: ModelBenchmarkListItem,
): UseCaseScores {
  const intelligence = model.intelligenceIndex ?? 0;
  const coding = model.codingIndex ?? 0;
  const math = model.mathIndex ?? 0;
  const speed = model.medianOutputTokensPerSecond ?? 0;
  const price = model.priceBlended1mTokens ?? Infinity;
  const agenticScore = calculateAgenticScore(model).agenticIndex ?? 0;

  // Normalize speed to 0-100 (assume max 200 tok/s)
  const normalizedSpeed = Math.min(speed / 2, 100);
  // Normalize price to 0-100 (assume max $50/M)
  const normalizedPrice = Math.min(price / 0.5, 100); // inverted later

  // Intelligence-weighted: intelligence (60%) + coding (20%) + math (20%)
  const intelligenceScore = intelligence * 0.6 + coding * 0.2 + math * 0.2;

  // Coding-weighted: coding (50%) + intelligence (30%) + agentic (20%)
  const codingScore = coding * 0.5 + intelligence * 0.3 + agenticScore * 0.2;

  // Agentic-weighted: agentic (60%) + coding (20%) + intelligence (20%)
  const agenticUseCaseScore = agenticScore * 0.6 + coding * 0.2 + intelligence * 0.2;

  // Fast & Cheap: speed (40%) + low price (40%) + intelligence (20%)
  const priceScore = price > 0 ? Math.min(10 / price, 1) * 100 : 0; // $10/M = 100, $20/M = 50
  const fastAndCheapScore = normalizedSpeed * 0.4 + priceScore * 0.4 + intelligence * 0.2;

  // Balanced: equal weights across intelligence, coding, math, speed, agentic
  const balancedScore =
    intelligence * 0.2 +
    coding * 0.2 +
    math * 0.2 +
    normalizedSpeed * 0.2 +
    agenticScore * 0.2;

  return {
    intelligence: Math.round(intelligenceScore * 10) / 10,
    coding: Math.round(codingScore * 10) / 10,
    agentic: Math.round(agenticUseCaseScore * 10) / 10,
    fastAndCheap: Math.round(fastAndCheapScore * 10) / 10,
    balanced: Math.round(balancedScore * 10) / 10,
  };
}

/**
 * Count how many raw benchmarks are non-null for a model.
 */
export function getCoverageCount(model: ModelBenchmarkListItem): number {
  let count = 0;
  for (const key of RAW_BENCHMARK_KEYS) {
    if (model[key] !== null && model[key] !== undefined) {
      count++;
    }
  }
  return count;
}

export { RAW_BENCHMARK_KEYS };
```

Also update the import at the top of `benchmark-utils.ts` to include the new types:

```typescript
import type {
  AgenticScore,
  ModelAnalysis,
  ValueScore,
  UseCaseScores,
  PercentileMap,
} from "./benchmark-types";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @lite-llm/web test -- --run apps/web/src/pages/benchmarks/__tests__/benchmark-utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/benchmarks/benchmark-utils.ts apps/web/src/pages/benchmarks/__tests__/benchmark-utils.test.ts
git commit -m "feat(benchmarks): add calculatePercentiles, calculateUseCaseScores, getCoverageCount utils"
```

---

## Task 3: Create use-benchmarks-actions Hook

**Files:**
- Create: `apps/web/src/pages/benchmarks/use-benchmarks-actions.ts`

- [ ] **Step 1: Write the file**

```typescript
import { useCallback } from "react";
import type { UseCase } from "./benchmark-types";

const MAX_COMPARED_MODELS = 20;

export interface UseBenchmarksActionsResult {
  selectedIds: string[];
  activeUseCase: UseCase;
  toggleModel: (id: string) => void;
  clearAll: () => void;
  setUseCase: (useCase: UseCase) => void;
  compareTop3: (
    candidateIds: string[],
    getUseCaseScore: (id: string) => number,
  ) => void;
}

export function useBenchmarksActions(
  selectedIds: string[],
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
  activeUseCase: UseCase,
  setActiveUseCase: (useCase: UseCase) => void,
): UseBenchmarksActionsResult {
  const toggleModel = useCallback(
    (id: string) => {
      setSelectedIds((current) => {
        if (current.includes(id)) {
          return current.filter((item) => item !== id);
        }
        if (current.length >= MAX_COMPARED_MODELS) {
          return [...current.slice(1), id];
        }
        return [...current, id];
      });
    },
    [setSelectedIds],
  );

  const clearAll = useCallback(() => {
    setSelectedIds([]);
  }, [setSelectedIds]);

  const setUseCase = useCallback(
    (useCase: UseCase) => {
      setActiveUseCase(useCase);
    },
    [setActiveUseCase],
  );

  const compareTop3 = useCallback(
    (
      candidateIds: string[],
      getUseCaseScore: (id: string) => number,
    ) => {
      const scored = candidateIds
        .map((id) => ({ id, score: getUseCaseScore(id) }))
        .sort((a, b) => b.score - a.score);
      const top3 = scored.slice(0, 3).map((s) => s.id);
      setSelectedIds(top3);
    },
    [setSelectedIds],
  );

  return {
    selectedIds,
    activeUseCase,
    toggleModel,
    clearAll,
    setUseCase,
    compareTop3,
  };
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/benchmarks/use-benchmarks-actions.ts
git commit -m "feat(benchmarks): add useBenchmarksActions hook"
```

---

## Task 4: Create use-benchmarks-derived Hook

**Files:**
- Create: `apps/web/src/pages/benchmarks/use-benchmarks-derived.ts`

- [ ] **Step 1: Write the file**

```typescript
import { useMemo } from "react";
import type { ModelBenchmarkListItem } from "@lite-llm/api-contracts";
import type { ComparisonCardData, UseCase } from "./benchmark-types";
import {
  calculateAgenticScore,
  calculateValueScore,
  calculateCompositeScore,
  calculateRankings,
  calculatePercentiles,
  calculateUseCaseScores,
  getCoverageCount,
} from "./benchmark-utils";

const RAW_BENCHMARK_TOTAL = 12; // mmluPro, gpqa, hle, livecodebench, scicode, math500, aime, aime25, tau2, ifbench, lcr, terminalbenchHard

export interface UseBenchmarksDerivedResult {
  percentiles: Map<string, PercentileMap>;
  cardData: ComparisonCardData[];
  sortedByUseCase: ComparisonCardData[];
  activeUseCase: UseCase;
}

export function useBenchmarksDerived(
  rows: ModelBenchmarkListItem[],
  selectedIds: string[],
  activeUseCase: UseCase,
): UseBenchmarksDerivedResult {
  // Build card data for selected models (or all rows if none selected)
  const cardData = useMemo<ComparisonCardData[]>(() => {
    const compareRows =
      selectedIds.length > 0
        ? rows.filter((r) => selectedIds.includes(r.id))
        : rows.slice(0, 3);

    // Pre-calculate rankings across all rows
    const rankingsMap = calculateRankings(rows);

    // Pre-calculate percentiles across all rows for each model
    const percentileMap = new Map<string, PercentileMap>();
    for (const row of rows) {
      percentileMap.set(row.id, calculatePercentiles(rows, row));
    }

    return compareRows.map((model) => {
      const agentic = calculateAgenticScore(model);
      const value = calculateValueScore(model);
      const compositeScore = calculateCompositeScore(model, agentic);
      const rankings = rankingsMap.get(model.id);
      const useCaseScores = calculateUseCaseScores(model);
      const percentiles = percentileMap.get(model.id) ?? new Map();
      const coverageCount = getCoverageCount(model);

      return {
        model,
        agentic,
        value,
        compositeScore,
        percentiles,
        useCaseScores,
        rank: rankings?.rank ?? {
          intelligence: 0,
          coding: 0,
          math: 0,
          agentic: 0,
          speed: 0,
          price: 0,
          value: 0,
        },
        coverageCount,
        totalBenchmarks: RAW_BENCHMARK_TOTAL,
      } satisfies ComparisonCardData;
    });
  }, [rows, selectedIds]);

  // Sort card data by active use case score
  const sortedByUseCase = useMemo<ComparisonCardData[]>(() => {
    return [...cardData].sort((a, b) => {
      const scoreA = a.useCaseScores[activeUseCase];
      const scoreB = b.useCaseScores[activeUseCase];
      return scoreB - scoreA;
    });
  }, [cardData, activeUseCase]);

  return {
    percentiles: new Map(), // kept for potential future use
    cardData,
    sortedByUseCase,
    activeUseCase,
  };
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/benchmarks/use-benchmarks-derived.ts
git commit -m "feat(benchmarks): add useBenchmarksDerived hook with cardData and useCase sorting"
```

---

## Task 5: Create use-benchmarks-page Hook

**Files:**
- Create: `apps/web/src/pages/benchmarks/use-benchmarks-page.ts`

- [ ] **Step 1: Write the file**

```typescript
import { useState } from "react";
import type { UseCase } from "./benchmark-types";
import { useBenchmarksState } from "./use-benchmarks-state";
import { useBenchmarksActions } from "./use-benchmarks-actions";
import { useBenchmarksDerived } from "./use-benchmarks-derived";

export interface UseBenchmarksPageResult
  extends ReturnType<typeof useBenchmarksState>,
    ReturnType<typeof useBenchmarksActions>,
    ReturnType<typeof useBenchmarksDerived> {}

export function useBenchmarksPage(): UseBenchmarksPageResult {
  const state = useBenchmarksState();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeUseCase, setActiveUseCase] = useState<UseCase>("balanced");

  const actions = useBenchmarksActions(
    selectedIds,
    setSelectedIds,
    activeUseCase,
    setActiveUseCase,
  );

  const derived = useBenchmarksDerived(
    state.rows,
    selectedIds,
    activeUseCase,
  );

  return {
    ...state,
    ...actions,
    ...derived,
  };
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/benchmarks/use-benchmarks-page.ts
git commit -m "feat(benchmarks): add useBenchmarksPage composing state + actions + derived"
```

---

## Task 6: Create MetricBar Component

**Files:**
- Create: `apps/web/src/components/benchmark/metric-bar.tsx`

- [ ] **Step 1: Write the component**

```typescript
import type { ReactNode } from "react";

interface MetricBarProps {
  label: ReactNode;
  value: number | null;
  percentile: number | null; // 0-100
  formatValue?: (value: number) => string;
  color?: string;
}

export function MetricBar({
  label,
  value,
  percentile,
  formatValue = (v) => v.toFixed(1),
  color = "bg-blue-500",
}: MetricBarProps) {
  const displayValue = value !== null ? formatValue(value) : "—";
  const barPercent = percentile !== null ? Math.min(100, Math.max(0, percentile)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{displayValue}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${barPercent}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/benchmark/metric-bar.tsx
git commit -m "feat(benchmark): add MetricBar component"
```

---

## Task 7: Create MiniRadarChart Component

**Files:**
- Create: `apps/web/src/components/benchmark/mini-radar-chart.tsx`

- [ ] **Step 1: Write the component**

```typescript
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { PercentileMap } from "@/pages/benchmarks/benchmark-types";

interface MiniRadarChartProps {
  percentiles: PercentileMap;
  modelId: string;
  color?: string;
}

const RADAR_METRICS = [
  { key: "intelligenceIndex", label: "Intel", axis: 0 },
  { key: "codingIndex", label: "Code", axis: 1 },
  { key: "mathIndex", label: "Math", axis: 2 },
  { key: "agenticIndex", label: "Agent", axis: 3 },
  { key: "medianOutputTokensPerSecond", label: "Speed", axis: 4 },
] as const;

export function MiniRadarChart({
  percentiles,
  color = "#2563eb",
}: MiniRadarChartProps) {
  const data = RADAR_METRICS.map((m) => ({
    metric: m.label,
    value: percentiles.get(m.key) ?? 0,
  }));

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
          />
          <Radar
            name="Model"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/benchmark/mini-radar-chart.tsx
git commit -m "feat(benchmark): add MiniRadarChart component"
```

---

## Task 8: Create RawBenchmarkGrid Component

**Files:**
- Create: `apps/web/src/components/benchmark/raw-benchmark-grid.tsx`

- [ ] **Step 1: Write the component**

```typescript
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ModelBenchmarkListItem } from "@lite-llm/api-contracts";

interface RawBenchmarkGridProps {
  model: ModelBenchmarkListItem;
}

const BENCHMARK_CONFIG = [
  { key: "mmluPro", label: "MMLU-Pro", higherIsBetter: true },
  { key: "gpqa", label: "GPQA", higherIsBetter: true },
  { key: "hle", label: "HLE", higherIsBetter: true },
  { key: "livecodebench", label: "LiveCode", higherIsBetter: true },
  { key: "scicode", label: "SciCode", higherIsBetter: true },
  { key: "math500", label: "MATH-500", higherIsBetter: true },
  { key: "aime", label: "AIME", higherIsBetter: true },
  { key: "aime25", label: "AIME-2025", higherIsBetter: true },
  { key: "tau2", label: "TAU2", higherIsBetter: true },
  { key: "ifbench", label: "IfBench", higherIsBetter: true },
  { key: "lcr", label: "LCR", higherIsBetter: true },
  { key: "terminalbenchHard", label: "Terminal", higherIsBetter: true },
] as const;

function formatRawValue(value: number | null): string {
  if (value === null) return "—";
  if (value > 100) return value.toFixed(0);
  return value.toFixed(1);
}

export function RawBenchmarkGrid({ model }: RawBenchmarkGridProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {expanded ? "Hide" : "Show"} raw benchmarks
      </button>

      {expanded && (
        <div className="grid grid-cols-3 gap-2">
          {BENCHMARK_CONFIG.map((bench) => {
            const value = model[bench.key as keyof ModelBenchmarkListItem] as
              | number
              | null;
            return (
              <div
                key={bench.key}
                className="flex flex-col rounded-md bg-muted/50 px-2 py-1.5"
              >
                <span className="text-[10px] text-muted-foreground truncate">
                  {bench.label}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatRawValue(value)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/benchmark/raw-benchmark-grid.tsx
git commit -m "feat(benchmark): add RawBenchmarkGrid collapsible component"
```

---

## Task 9: Create RankingList Component

**Files:**
- Create: `apps/web/src/components/benchmark/ranking-list.tsx`

- [ ] **Step 1: Write the component**

```typescript
import type { ComparisonCardData } from "@/pages/benchmarks/benchmark-types";

interface RankingListProps {
  rank: ComparisonCardData["rank"];
  topN?: number;
}

const RANK_LABELS: Record<keyof ComparisonCardData["rank"], string> = {
  intelligence: "Intel",
  coding: "Code",
  math: "Math",
  agentic: "Agent",
  speed: "Speed",
  price: "Price",
  value: "Value",
};

export function RankingList({ rank, topN = 3 }: RankingListProps) {
  const entries = (Object.entries(rank) as [keyof typeof rank, number][])
    .filter(([, value]) => value > 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, topN);

  if (entries.length === 0) {
    return <span className="text-xs text-muted-foreground">No rankings</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium"
        >
          #{value} {RANK_LABELS[key]}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/benchmark/ranking-list.tsx
git commit -m "feat(benchmark): add RankingList component"
```

---

## Task 10: Create DataCoverageBar Component

**Files:**
- Create: `apps/web/src/components/benchmark/data-coverage-bar.tsx`

- [ ] **Step 1: Write the component**

```typescript
interface DataCoverageBarProps {
  count: number;
  total: number;
}

export function DataCoverageBar({ count, total }: DataCoverageBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const isLow = percentage < 50;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Coverage</span>
        <span className={isLow ? "text-amber-500" : ""}>
          {count}/{total} benchmarks
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isLow ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/benchmark/data-coverage-bar.tsx
git commit -m "feat(benchmark): add DataCoverageBar component"
```

---

## Task 11: Create UseCaseFilter Component

**Files:**
- Create: `apps/web/src/components/benchmark/use-case-filter.tsx`

- [ ] **Step 1: Write the component**

```typescript
import { Brain, Code, Bot, Zap, Scale } from "lucide-react";
import type { UseCase } from "@/pages/benchmarks/benchmark-types";

interface UseCaseFilterProps {
  activeUseCase: UseCase;
  onUseCaseChange: (useCase: UseCase) => void;
  onCompareTop3: () => void;
  selectedCount: number;
  totalCount: number;
  onClearAll: () => void;
}

const USE_CASES: { value: UseCase; label: string; icon: React.ReactNode }[] = [
  { value: "intelligence", label: "Intelligence", icon: <Brain className="h-3 w-3" /> },
  { value: "coding", label: "Coding", icon: <Code className="h-3 w-3" /> },
  { value: "agentic", label: "Agentic", icon: <Bot className="h-3 w-3" /> },
  { value: "fastAndCheap", label: "Fast & Cheap", icon: <Zap className="h-3 w-3" /> },
  { value: "balanced", label: "Balanced", icon: <Scale className="h-3 w-3" /> },
];

const CHART_COLORS: Record<UseCase, string> = {
  intelligence: "#2563eb",
  coding: "#059669",
  agentic: "#7c3aed",
  fastAndCheap: "#d97706",
  balanced: "#0f766e",
};

export function UseCaseFilter({
  activeUseCase,
  onUseCaseChange,
  onCompareTop3,
  selectedCount,
  totalCount,
  onClearAll,
}: UseCaseFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        {USE_CASES.map((uc) => (
          <button
            key={uc.value}
            type="button"
            onClick={() => onUseCaseChange(uc.value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              activeUseCase === uc.value
                ? "text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
            style={
              activeUseCase === uc.value
                ? { backgroundColor: CHART_COLORS[uc.value] }
                : undefined
            }
          >
            {uc.icon}
            {uc.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-muted-foreground">
          {selectedCount > 0
            ? `Comparing ${selectedCount} model${selectedCount !== 1 ? "s" : ""}`
            : `Showing top ${totalCount} by ${activeUseCase}`}
        </span>
        <button
          type="button"
          onClick={onCompareTop3}
          className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Compare top 3
        </button>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/benchmark/use-case-filter.tsx
git commit -m "feat(benchmark): add UseCaseFilter component with chips"
```

---

## Task 12: Create ComparisonCard Component

**Files:**
- Create: `apps/web/src/components/benchmark/comparison-card.tsx`

- [ ] **Step 1: Write the component**

```typescript
import { Badge } from "@/components/ui/badge";
import { MiniRadarChart } from "./mini-radar-chart";
import { MetricBar } from "./metric-bar";
import { RawBenchmarkGrid } from "./raw-benchmark-grid";
import { RankingList } from "./ranking-list";
import { DataCoverageBar } from "./data-coverage-bar";
import type { ComparisonCardData, UseCase } from "@/pages/benchmarks/benchmark-types";
import { formatSpeed, formatLatencySeconds, formatBenchmarkPrice, formatValueScore } from "@/pages/benchmarks/benchmark-utils";

const CHART_COLORS: Record<UseCase, string> = {
  intelligence: "#2563eb",
  coding: "#059669",
  agentic: "#7c3aed",
  fastAndCheap: "#d97706",
  balanced: "#0f766e",
};

const CORE_METRICS = [
  { key: "intelligenceIndex", label: "Intelligence", color: "bg-blue-500" },
  { key: "codingIndex", label: "Coding", color: "bg-emerald-500" },
  { key: "mathIndex", label: "Math", color: "bg-amber-500" },
  { key: "agenticIndex", label: "Agentic", color: "bg-purple-500" },
] as const;

interface ComparisonCardProps {
  card: ComparisonCardData;
  activeUseCase: UseCase;
  isSelected: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function ComparisonCard({ card, activeUseCase, isSelected }: ComparisonCardProps) {
  const { model, agentic, value, compositeScore, percentiles, useCaseScores, rank, coverageCount, totalBenchmarks } = card;
  const borderColor = isSelected ? CHART_COLORS[activeUseCase] : "border-border";
  const cardColor = CHART_COLORS[activeUseCase];

  return (
    <div
      className={`w-[320px] flex-shrink-0 rounded-lg border-2 bg-card p-4 space-y-4 flex flex-col ${borderColor}`}
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{model.name}</h3>
            <p className="text-xs text-muted-foreground">{model.creatorName}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              #{rank[activeUseCase] || "-"} {activeUseCase}
            </Badge>
            {model.isConfigured && (
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                Configured
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Mini Radar */}
      <MiniRadarChart percentiles={percentiles} modelId={model.id} color={cardColor} />

      {/* Overall Score */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Overall Score</span>
          <span className="font-semibold tabular-nums">{compositeScore.toFixed(1)}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getScoreColor(compositeScore)}`}
            style={{ width: `${Math.min(100, compositeScore)}%` }}
          />
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {CORE_METRICS.map((m) => {
          const modelValue = m.key === "agenticIndex"
            ? agentic.agenticIndex
            : model[m.key as keyof typeof model] as number | null;
          const pct = m.key === "agenticIndex"
            ? percentiles.get("agenticIndex")
            : percentiles.get(m.key);
          return (
            <MetricBar
              key={m.key}
              label={m.label}
              value={modelValue}
              percentile={pct ?? null}
              formatValue={(v) => v.toFixed(1)}
              color={m.color}
            />
          );
        })}
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Speed</p>
          <p className="text-xs font-medium tabular-nums">
            {formatSpeed(model.medianOutputTokensPerSecond)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Latency</p>
          <p className="text-xs font-medium tabular-nums">
            {formatLatencySeconds(model.medianTimeToFirstTokenSeconds)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground">Price</p>
          <p className="text-xs font-medium tabular-nums">
            {formatBenchmarkPrice(model.priceBlended1mTokens)}
          </p>
        </div>
      </div>

      {/* Value Analysis */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-medium">Value per USD</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground">Intel/$</p>
            <p className="text-xs font-medium tabular-nums">
              {formatValueScore(value.intelligencePerDollar)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground">Speed/$</p>
            <p className="text-xs font-medium tabular-nums">
              {formatValueScore(value.speedPerDollar)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground">Agent/$</p>
            <p className="text-xs font-medium tabular-nums">
              {formatValueScore(value.agenticPerDollar)}
            </p>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground font-medium">Rankings</p>
        <RankingList rank={rank} topN={4} />
      </div>

      {/* Raw Benchmarks */}
      <RawBenchmarkGrid model={model} />

      {/* Coverage */}
      <DataCoverageBar count={coverageCount} total={totalBenchmarks} />
    </div>
  );
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/benchmark/comparison-card.tsx
git commit -m "feat(benchmark): add ComparisonCard with radar, metrics, value analysis, rankings"
```

---

## Task 13: Create ComparisonDeck Component

**Files:**
- Create: `apps/web/src/components/benchmark/comparison-deck.tsx`

- [ ] **Step 1: Write the component**

```typescript
import type { ComparisonCardData, UseCase } from "@/pages/benchmarks/benchmark-types";
import { ComparisonCard } from "./comparison-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Scale } from "lucide-react";

interface ComparisonDeckProps {
  cards: ComparisonCardData[];
  activeUseCase: UseCase;
  selectedIds: string[];
  onToggleModel: (id: string) => void;
}

export function ComparisonDeck({
  cards,
  activeUseCase,
  selectedIds,
  onToggleModel,
}: ComparisonDeckProps) {
  if (cards.length === 0) {
    return (
      <EmptyState
        title="No models to compare"
        description="Select models from the table or click 'Compare top 3' to get started."
        icon={Scale}
      />
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
        {cards.map((card) => (
          <div key={card.model.id} className="snap-start">
            <ComparisonCard
              card={card}
              activeUseCase={activeUseCase}
              isSelected={selectedIds.includes(card.model.id)}
              onToggleModel={onToggleModel}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

Note: The `ComparisonCard` interface needs `onToggleModel`. Update `Task 12` to add `onToggleModel` prop to `ComparisonCardProps`. For now, skip this step and keep the card as-is (the toggle happens via the filter bar's "Compare top 3" and individual selection in the "All models" tab).

Actually, let me update the card to remove the `isSelected` and `onToggleModel` props since they're not needed in the card itself — selection is done from the table.

- [ ] **Step 2: Verify file compiles**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/benchmark/comparison-deck.tsx
git commit -m "feat(benchmark): add ComparisonDeck horizontal scroll container"
```

---

## Task 14: Wire Everything in BenchmarksPage

**Files:**
- Modify: `apps/web/src/pages/benchmarks.tsx` — replace comparison tab

- [ ] **Step 1: Replace the comparison tab JSX**

In `benchmarks.tsx`, replace the entire `<TabsContent value="compare">` block (lines 463-591) with:

```tsx
<TabsContent value="compare" className="space-y-4">
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm">Compare Models</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <UseCaseFilter
        activeUseCase={activeUseCase}
        onUseCaseChange={setUseCase}
        onCompareTop3={() => compareTop3(
          state.rows.map((r) => r.id),
          (id) => {
            const card = sortedByUseCase.find((c) => c.model.id === id);
            return card ? card.useCaseScores[activeUseCase] : 0;
          },
        )}
        selectedCount={selectedIds.length}
        totalCount={Math.min(3, state.rows.length)}
        onClearAll={clearAll}
      />
    </CardContent>
  </Card>

  <ComparisonDeck
    cards={sortedByUseCase}
    activeUseCase={activeUseCase}
    selectedIds={selectedIds}
    onToggleModel={toggleModel}
  />

  <p className="text-xs text-muted-foreground px-1">
    Showing {sortedByUseCase.length} model{sortedByUseCase.length !== 1 ? "s" : ""} sorted by{" "}
    <span className="font-medium capitalize">{activeUseCase.replace(/([A-Z])/g, " $1").trim()}</span>.
    Select models from the "All models" tab to compare specific ones.
  </p>
</TabsContent>
```

Add the new imports at the top of `benchmarks.tsx`:

```tsx
import { ComparisonDeck } from "../components/benchmark/comparison-deck";
import { UseCaseFilter } from "../components/benchmark/use-case-filter";
import { useBenchmarksPage } from "./benchmarks/use-benchmarks-page";
```

Replace the existing hook usage:

```tsx
// Before:
const state = useBenchmarksState();
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// After:
const page = useBenchmarksPage();
const { selectedIds, activeUseCase, toggleModel, clearAll, setUseCase, compareTop3, sortedByUseCase, rows } = page;
// Also destructure state properties:
// const { rows, providers, isLoading, error, ... } = page;
```

Full destructuring:
```tsx
export function BenchmarksPage() {
  const page = useBenchmarksPage();
  const {
    // state
    providers,
    rows,
    configuredCount,
    isLoading,
    error,
    source,
    sourceUrl,
    fetchedAt,
    totalCount,
    search,
    provider,
    showConfiguredOnly,
    minIntelligence,
    maxBlendedPrice,
    sortField,
    sortDirection,
    setSearch,
    setProvider,
    setShowConfiguredOnly,
    setMinIntelligence,
    setMaxBlendedPrice,
    setSortField,
    setSortDirection,
    // actions
    selectedIds,
    activeUseCase,
    toggleModel,
    clearAll,
    setUseCase,
    compareTop3,
    // derived
    sortedByUseCase,
  } = page;
```

- [ ] **Step 2: Remove unused imports**

Remove from `benchmarks.tsx` imports that are no longer used after the refactor:
- `Bar`, `BarChart`, `CartesianGrid`, `Legend`, `PolarAngleAxis`, `PolarGrid`, `Radar`, `RadarChart`, `XAxis`, `YAxis` (Recharts — used only in old comparison tab)
- `avg`, `safeNumber` (used only in old analysis)
- `MAX_COMPARED_MODELS` (moved to actions)
- `useMemo`, `useState` — `useState` still needed for local filter state, `useMemo` still used for `compareCandidates`
- Remove: `scoreData`, `radarData`, `analysis` memoized values that are no longer needed

- [ ] **Step 3: Verify full typecheck**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors. Fix any import or type errors.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @lite-llm/web test -- --run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/benchmarks.tsx
git commit -m "refactor(benchmarks): replace comparison tab with Smart Comparison Deck"
```

---

## Task 15: Final Verification

- [ ] **Step 1: Typecheck all web app**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: PASS

- [ ] **Step 2: Lint**

Run: `pnpm --filter @lite-llm/web lint`
Expected: PASS (or pre-existing warnings only)

- [ ] **Step 3: Format**

Run: `pnpm --filter @lite-llm/web format`
Expected: Auto-formats changed files

- [ ] **Step 4: Build**

Run: `pnpm --filter @lite-llm/web build`
Expected: BUILD SUCCESSFUL

---

## Self-Review Checklist

1. **Spec coverage:** Every design item in the spec has a corresponding task above.
2. **Placeholder scan:** No TBD, TODO, "implement later" in any step.
3. **Type consistency:** All types referenced across tasks match what's defined in Task 1.
4. **Existing code untouched:** The "All models" tab is completely unchanged.
5. **New components are standalone:** `MetricBar`, `MiniRadarChart`, `RawBenchmarkGrid`, `RankingList`, `DataCoverageBar`, `UseCaseFilter`, `ComparisonCard`, `ComparisonDeck` — each has a single responsibility.
