import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import { formatCurrency, formatNumber } from "@/shared/lib/format";
import { APP_LOCALE, APP_TIMEZONE } from "@/shared/lib/locale";
import type {
  AgenticScore,
  PercentileMap,
  UseCaseScores,
  ValueScore,
} from "./benchmark-types";

/**
 * Format a nullable number with the specified decimal places.
 */
export function formatNullableNumber(
  value: number | null,
  decimals = 1,
): string {
  if (value === null || Number.isNaN(value)) return "\u2014";
  return value.toFixed(decimals);
}

/**
 * Format a benchmark price as $X.XX/M.
 */
export function formatBenchmarkPrice(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "\u2014";
  return `${formatCurrency(value)}/M`;
}

/**
 * Format speed as X tok/s.
 */
export function formatSpeed(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "\u2014";
  return `${formatNumber(value)} tok/s`;
}

/**
 * Format latency as X.XXs.
 */
export function formatLatencySeconds(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "\u2014";
  return `${value.toFixed(2)}s`;
}

/**
 * Format a value score (intelligence/cost ratio) with 2 decimal places.
 */
export function formatValueScore(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "\u2014";
  return value.toFixed(2);
}

/**
 * Format a fetched-at timestamp into a human-readable date string.
 */
export function formatFetchedAt(value: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString(APP_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Raw benchmark metric config with display labels.
 * Single source of truth — RAW_BENCHMARK_KEYS derived from this.
 */
export const BENCHMARK_CONFIG = [
  { key: "mmluPro", label: "MMLU-Pro" },
  { key: "gpqa", label: "GPQA" },
  { key: "hle", label: "HLE" },
  { key: "livecodebench", label: "LiveCode" },
  { key: "scicode", label: "SciCode" },
  { key: "math500", label: "MATH-500" },
  { key: "aime", label: "AIME" },
  { key: "aime25", label: "AIME-2025" },
  { key: "tau2", label: "TAU2" },
  { key: "ifbench", label: "IfBench" },
  { key: "lcr", label: "LCR" },
  { key: "terminalbenchHard", label: "Terminal" },
] as const;

/**
 * Raw benchmark metric keys that appear on ModelBenchmarkListItem.
 * Derived from BENCHMARK_CONFIG single source of truth.
 */
const RAW_BENCHMARK_KEYS = BENCHMARK_CONFIG.map((b) => b.key);

export { RAW_BENCHMARK_KEYS };

/**
 * Compute agentic benchmark scores from tau2, ifbench, lcr, terminalbenchHard.
 * agenticIndex is the average of any non-null agentic benchmarks.
 * coverage is the count of non-null agentic benchmarks (0-4).
 */
export function calculateAgenticScore(
  model: ModelBenchmarkListItem,
): AgenticScore {
  const values = [
    model.tau2,
    model.ifbench,
    model.lcr,
    model.terminalbenchHard,
  ];
  const nonNull = values.filter(
    (v): v is number => v !== null && v !== undefined,
  );
  const coverage = nonNull.length;
  const agenticIndex =
    coverage > 0 ? nonNull.reduce((sum, v) => sum + v, 0) / coverage : null;
  return {
    tau2: model.tau2,
    ifbench: model.ifbench,
    lcr: model.lcr,
    terminalbenchHard: model.terminalbenchHard,
    agenticIndex,
    coverage,
  };
}

/**
 * Compute value-per-dollar metrics for a model.
 * Each metric is: benchmark_score / price_per_million_tokens.
 */
export function calculateValueScore(model: ModelBenchmarkListItem): ValueScore {
  const price = model.priceBlended1mTokens;

  const intelligencePerDollar =
    model.intelligenceIndex !== null && price !== null && price > 0
      ? model.intelligenceIndex / price
      : null;

  const speedPerDollar =
    model.medianOutputTokensPerSecond !== null && price !== null && price > 0
      ? model.medianOutputTokensPerSecond / price
      : null;

  const agentic = calculateAgenticScore(model);
  const agenticPerDollar =
    agentic.agenticIndex !== null && price !== null && price > 0
      ? agentic.agenticIndex / price
      : null;

  return { intelligencePerDollar, speedPerDollar, agenticPerDollar };
}

/**
 * Calculate a 0-100 composite score combining intelligence, coding, math,
 * and agentic benchmarks using weighted averaging.
 * Weights: intelligence 30%, coding 25%, math 20%, agentic 25%.
 */
export function calculateCompositeScore(
  model: ModelBenchmarkListItem,
  agentic: AgenticScore,
): number {
  const intelligence = model.intelligenceIndex ?? 0;
  const coding = model.codingIndex ?? 0;
  const math = model.mathIndex ?? 0;
  const agenticIndex = agentic.agenticIndex ?? 0;

  const composite =
    intelligence * 0.3 + coding * 0.25 + math * 0.2 + agenticIndex * 0.25;
  return Math.round(composite * 10) / 10;
}

/**
 * Compute 1-based ranks for each model across all benchmark dimensions.
 * 1 = best (highest score, or lowest for price).
 */
export function calculateRankings(rows: ModelBenchmarkListItem[]): Map<
  string,
  {
    intelligence: number;
    coding: number;
    math: number;
    agentic: number;
    speed: number;
    price: number;
    value: number;
  }
> {
  const result = new Map<
    string,
    {
      intelligence: number;
      coding: number;
      math: number;
      agentic: number;
      speed: number;
      price: number;
      value: number;
    }
  >();

  for (const row of rows) {
    result.set(row.id, {
      intelligence: 0,
      coding: 0,
      math: 0,
      agentic: 0,
      speed: 0,
      price: 0,
      value: 0,
    });
  }

  const applyRanks = (
    sorted: ModelBenchmarkListItem[],
    field: keyof (typeof result extends Map<string, infer V> ? V : never),
  ) => {
    for (let i = 0; i < sorted.length; i++) {
      const entry = result.get(sorted[i].id);
      if (entry) entry[field] = i + 1;
    }
  };

  // Intelligence: higher is better
  const byIntelligence = [...rows].sort(
    (a, b) => (b.intelligenceIndex ?? -1) - (a.intelligenceIndex ?? -1),
  );
  applyRanks(byIntelligence, "intelligence");

  // Coding: higher is better
  const byCoding = [...rows].sort(
    (a, b) => (b.codingIndex ?? -1) - (a.codingIndex ?? -1),
  );
  applyRanks(byCoding, "coding");

  // Math: higher is better
  const byMath = [...rows].sort(
    (a, b) => (b.mathIndex ?? -1) - (a.mathIndex ?? -1),
  );
  applyRanks(byMath, "math");

  // Agentic: higher is better
  const byAgentic = [...rows].sort((a, b) => {
    const aScore = calculateAgenticScore(a).agenticIndex ?? -1;
    const bScore = calculateAgenticScore(b).agenticIndex ?? -1;
    return bScore - aScore;
  });
  applyRanks(byAgentic, "agentic");

  // Speed: higher is better
  const bySpeed = [...rows].sort(
    (a, b) =>
      (b.medianOutputTokensPerSecond ?? -1) -
      (a.medianOutputTokensPerSecond ?? -1),
  );
  applyRanks(bySpeed, "speed");

  // Price: lower is better
  const byPrice = [...rows].sort(
    (a, b) =>
      (a.priceBlended1mTokens ?? Infinity) -
      (b.priceBlended1mTokens ?? Infinity),
  );
  applyRanks(byPrice, "price");

  // Value (composite): higher is better
  const byValue = [...rows].sort((a, b) => {
    const aScore = calculateCompositeScore(a, calculateAgenticScore(a));
    const bScore = calculateCompositeScore(b, calculateAgenticScore(b));
    return bScore - aScore;
  });
  applyRanks(byValue, "value");

  return result;
}

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

  const result = new Map();

  for (const key of metricKeys) {
    const values = rows
      .map((r) => r[key])
      .filter((v): v is number => v !== null && v !== undefined);

    if (
      values.length === 0 ||
      model[key] === null ||
      model[key] === undefined
    ) {
      result.set(key, 0);
      continue;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const rank = sorted.indexOf(model[key] as number);
    const percentile =
      sorted.length > 1 ? (rank / (sorted.length - 1)) * 100 : 100;
    result.set(key, Math.round(percentile));
  }

  // Agentic percentile
  const agenticScores = rows
    .map((r) => calculateAgenticScore(r).agenticIndex)
    .filter((v): v is number => v !== null);
  const modelAgentic = calculateAgenticScore(model).agenticIndex;
  if (agenticScores.length > 0 && modelAgentic !== null) {
    const sorted = [...agenticScores].sort((a, b) => a - b);
    const rank = sorted.indexOf(modelAgentic);
    const percentile =
      sorted.length > 1 ? (rank / (sorted.length - 1)) * 100 : 100;
    result.set("agenticIndex", Math.round(percentile));
  } else {
    result.set("agenticIndex", 0);
  }

  return result;
}

/**
 * Calculate contextual composite scores for each use case.
 * Use cases: intelligence, coding, agentic, fast & cheap, balanced.
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

  const normalizedSpeed = Math.min(speed / 2, 100);
  const priceScore = price > 0 ? Math.min(10 / price, 1) * 100 : 0;

  const intelligenceScore = intelligence * 0.6 + coding * 0.2 + math * 0.2;
  const codingScore = coding * 0.5 + intelligence * 0.3 + agenticScore * 0.2;
  const agenticUseCaseScore =
    agenticScore * 0.6 + coding * 0.2 + intelligence * 0.2;
  const fastAndCheapScore =
    normalizedSpeed * 0.4 + priceScore * 0.4 + intelligence * 0.2;
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
  const m = model as unknown as Record<string, number | null>;
  let count = 0;
  for (const key of RAW_BENCHMARK_KEYS) {
    if (m[key] !== null && m[key] !== undefined) {
      count++;
    }
  }
  return count;
}
