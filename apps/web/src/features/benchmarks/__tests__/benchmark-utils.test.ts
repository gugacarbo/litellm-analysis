import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import { describe, expect, it } from "vitest";
import {
  calculateAgenticScore,
  calculateCompositeScore,
  calculatePercentiles,
  calculateRankings,
  calculateUseCaseScores,
  calculateValueScore,
  formatBenchmarkPrice,
  formatLatencySeconds,
  formatNullableNumber,
  formatSpeed,
  formatValueScore,
  getCoverageCount,
  RAW_BENCHMARK_KEYS,
} from "../utils/benchmark-utils";

function createMockModel(
  overrides: Partial<ModelBenchmarkListItem> = {},
): ModelBenchmarkListItem {
  return {
    id: "test-model",
    name: "Test Model",
    slug: "test-model",
    creatorId: "creator-1",
    creatorName: "Test Creator",
    creatorSlug: "test-creator",
    intelligenceIndex: 90,
    codingIndex: 85,
    mathIndex: 78,
    mmluPro: 88,
    gpqa: null,
    hle: null,
    livecodebench: 82,
    scicode: null,
    math500: 75,
    aime: null,
    aime25: null,
    tau2: 0.7,
    ifbench: null,
    lcr: null,
    terminalbenchHard: null,
    priceInput1mTokens: 10.0,
    priceOutput1mTokens: 30.0,
    priceBlended1mTokens: 15.0,
    medianOutputTokensPerSecond: 100,
    medianTimeToFirstTokenSeconds: 0.3,
    medianTimeToFirstAnswerTokenSeconds: 0.5,
    isConfigured: true,
    matchedConfiguredModel: "test-model",
    source: "openrouter",
    ...overrides,
  };
}

function createEmptyMockModel(
  overrides: Partial<ModelBenchmarkListItem> = {},
): ModelBenchmarkListItem {
  return createMockModel({
    mmluPro: null,
    gpqa: null,
    hle: null,
    livecodebench: null,
    scicode: null,
    math500: null,
    aime: null,
    aime25: null,
    tau2: null,
    ifbench: null,
    lcr: null,
    terminalbenchHard: null,
    ...overrides,
  });
}

describe("formatNullableNumber", () => {
  it("should format a number with default decimals", () => {
    expect(formatNullableNumber(42.567)).toBe("42.6");
  });

  it("should format a number with custom decimals", () => {
    expect(formatNullableNumber(42.567, 2)).toBe("42.57");
  });

  it("should return em dash for null", () => {
    expect(formatNullableNumber(null)).toBe("\u2014");
  });

  it("should return em dash for NaN", () => {
    expect(formatNullableNumber(NaN)).toBe("\u2014");
  });

  it("should format zero correctly", () => {
    expect(formatNullableNumber(0)).toBe("0.0");
  });
});

describe("formatBenchmarkPrice", () => {
  it("should format price with /M suffix", () => {
    expect(formatBenchmarkPrice(15.0)).toBe("$15.00/M");
  });

  it("should return em dash for null", () => {
    expect(formatBenchmarkPrice(null)).toBe("\u2014");
  });

  it("should return em dash for NaN", () => {
    expect(formatBenchmarkPrice(NaN)).toBe("\u2014");
  });

  it("should format small prices", () => {
    expect(formatBenchmarkPrice(0.15)).toBe("$0.15/M");
  });
});

describe("formatSpeed", () => {
  it("should format speed with tok/s suffix", () => {
    expect(formatSpeed(100)).toBe("100 tok/s");
  });

  it("should return em dash for null", () => {
    expect(formatSpeed(null)).toBe("\u2014");
  });

  it("should return em dash for NaN", () => {
    expect(formatSpeed(NaN)).toBe("\u2014");
  });
});

describe("formatLatencySeconds", () => {
  it("should format latency with s suffix", () => {
    expect(formatLatencySeconds(0.3)).toBe("0.30s");
  });

  it("should return em dash for null", () => {
    expect(formatLatencySeconds(null)).toBe("\u2014");
  });

  it("should return em dash for NaN", () => {
    expect(formatLatencySeconds(NaN)).toBe("\u2014");
  });
});

describe("formatValueScore", () => {
  it("should format value score with 2 decimals", () => {
    expect(formatValueScore(6.0)).toBe("6.00");
  });

  it("should return em dash for null", () => {
    expect(formatValueScore(null)).toBe("\u2014");
  });

  it("should return em dash for NaN", () => {
    expect(formatValueScore(NaN)).toBe("\u2014");
  });

  it("should format small values", () => {
    expect(formatValueScore(0.05)).toBe("0.05");
  });
});

describe("RAW_BENCHMARK_KEYS", () => {
  it("should have exactly 12 benchmark keys", () => {
    expect(RAW_BENCHMARK_KEYS).toHaveLength(12);
  });

  it("should include all major benchmark categories", () => {
    expect(RAW_BENCHMARK_KEYS).toContain("mmluPro");
    expect(RAW_BENCHMARK_KEYS).toContain("gpqa");
    expect(RAW_BENCHMARK_KEYS).toContain("hle");
    expect(RAW_BENCHMARK_KEYS).toContain("livecodebench");
    expect(RAW_BENCHMARK_KEYS).toContain("scicode");
    expect(RAW_BENCHMARK_KEYS).toContain("math500");
    expect(RAW_BENCHMARK_KEYS).toContain("aime");
    expect(RAW_BENCHMARK_KEYS).toContain("aime25");
    expect(RAW_BENCHMARK_KEYS).toContain("tau2");
    expect(RAW_BENCHMARK_KEYS).toContain("ifbench");
    expect(RAW_BENCHMARK_KEYS).toContain("lcr");
    expect(RAW_BENCHMARK_KEYS).toContain("terminalbenchHard");
  });
});

describe("calculateAgenticScore", () => {
  it("should compute agentic index from non-null benchmarks", () => {
    const model = createMockModel({
      tau2: 0.7,
      ifbench: 0.5,
      lcr: null,
      terminalbenchHard: null,
    });
    const result = calculateAgenticScore(model);
    expect(result.tau2).toBe(0.7);
    expect(result.ifbench).toBe(0.5);
    expect(result.lcr).toBeNull();
    expect(result.terminalbenchHard).toBeNull();
    expect(result.agenticIndex).toBeCloseTo(0.6); // (0.7 + 0.5) / 2
    expect(result.coverage).toBe(2);
  });

  it("should return null agenticIndex when all benchmarks are null", () => {
    const model = createEmptyMockModel();
    const result = calculateAgenticScore(model);
    expect(result.agenticIndex).toBeNull();
    expect(result.coverage).toBe(0);
  });

  it("should work with all four benchmarks populated", () => {
    const model = createMockModel({
      tau2: 0.8,
      ifbench: 0.6,
      lcr: 0.9,
      terminalbenchHard: 0.5,
    });
    const result = calculateAgenticScore(model);
    expect(result.agenticIndex).toBeCloseTo(0.7); // (0.8 + 0.6 + 0.9 + 0.5) / 4
    expect(result.coverage).toBe(4);
  });

  it("should work with a single benchmark populated", () => {
    const model = createEmptyMockModel({
      ifbench: 0.75,
    });
    const result = calculateAgenticScore(model);
    expect(result.agenticIndex).toBe(0.75);
    expect(result.coverage).toBe(1);
  });
});

describe("calculateValueScore", () => {
  it("should compute value scores when both index and price exist", () => {
    const model = createMockModel({
      intelligenceIndex: 90,
      medianOutputTokensPerSecond: 100,
      priceBlended1mTokens: 15.0,
    });
    const result = calculateValueScore(model);
    expect(result.intelligencePerDollar).toBeCloseTo(6.0); // 90 / 15
    expect(result.speedPerDollar).toBeCloseTo(6.6667, 3); // 100 / 15
    // agenticPerDollar: agenticIndex = (0.7) / 1 = 0.7, then 0.7 / 15 = 0.0467
    expect(result.agenticPerDollar).toBeCloseTo(0.0467, 3);
  });

  it("should return null scores when price is null", () => {
    const model = createMockModel({ priceBlended1mTokens: null });
    const result = calculateValueScore(model);
    expect(result.intelligencePerDollar).toBeNull();
    expect(result.speedPerDollar).toBeNull();
    expect(result.agenticPerDollar).toBeNull();
  });

  it("should return null scores when price is zero", () => {
    const model = createMockModel({ priceBlended1mTokens: 0 });
    const result = calculateValueScore(model);
    expect(result.intelligencePerDollar).toBeNull();
    expect(result.speedPerDollar).toBeNull();
    expect(result.agenticPerDollar).toBeNull();
  });

  it("should return null for intelligence when index is null", () => {
    const model = createMockModel({
      intelligenceIndex: null,
      priceBlended1mTokens: 10.0,
    });
    const result = calculateValueScore(model);
    expect(result.intelligencePerDollar).toBeNull();
  });
});

describe("calculateCompositeScore", () => {
  it("should compute a weighted composite score", () => {
    const model = createMockModel({
      intelligenceIndex: 90,
      codingIndex: 85,
      mathIndex: 78,
    });
    const agentic = calculateAgenticScore(model);
    // 90*0.3 + 85*0.25 + 78*0.2 + 0.7*0.25 = 27 + 21.25 + 15.6 + 0.175 = 64.025
    const result = calculateCompositeScore(model, agentic);
    expect(result).toBe(64.0);
  });

  it("should handle missing agentic benchmarks", () => {
    const model = createEmptyMockModel({
      intelligenceIndex: 90,
      codingIndex: 85,
      mathIndex: 78,
    });
    const agentic = calculateAgenticScore(model);
    // 90*0.3 + 85*0.25 + 78*0.2 + 0*0.25 = 27 + 21.25 + 15.6 + 0 = 63.85
    const result = calculateCompositeScore(model, agentic);
    expect(result).toBe(63.9);
  });

  it("should return 0 when all indexes are null", () => {
    const model = createEmptyMockModel({
      intelligenceIndex: null,
      codingIndex: null,
      mathIndex: null,
    });
    const agentic = calculateAgenticScore(model);
    const result = calculateCompositeScore(model, agentic);
    expect(result).toBe(0);
  });
});

describe("calculateRankings", () => {
  it("should assign rank 1 to the best model in each dimension", () => {
    const best = createMockModel({
      id: "best",
      name: "Best Model",
      intelligenceIndex: 100,
      codingIndex: 100,
      mathIndex: 100,
      tau2: 1.0,
      ifbench: 1.0,
      lcr: 1.0,
      terminalbenchHard: 1.0,
      medianOutputTokensPerSecond: 200,
      priceBlended1mTokens: 5.0,
    });
    const worst = createMockModel({
      id: "worst",
      name: "Worst Model",
      intelligenceIndex: 10,
      codingIndex: 10,
      mathIndex: 10,
      tau2: 0.1,
      ifbench: 0.1,
      lcr: 0.1,
      terminalbenchHard: 0.1,
      medianOutputTokensPerSecond: 10,
      priceBlended1mTokens: 100.0,
    });
    const rankings = calculateRankings([best, worst]);
    expect(rankings.get("best")?.intelligence).toBe(1);
    expect(rankings.get("best")?.coding).toBe(1);
    expect(rankings.get("best")?.math).toBe(1);
    expect(rankings.get("best")?.agentic).toBe(1);
    expect(rankings.get("best")?.speed).toBe(1);
    expect(rankings.get("best")?.price).toBe(1); // lowest price = best
    expect(rankings.get("best")?.value).toBe(1);
  });

  it("should assign rank N to the worst model in each dimension", () => {
    const best = createMockModel({
      id: "best",
      name: "Best Model",
      intelligenceIndex: 100,
      codingIndex: 100,
      mathIndex: 100,
      tau2: 1.0,
      ifbench: 1.0,
      lcr: 1.0,
      terminalbenchHard: 1.0,
      medianOutputTokensPerSecond: 200,
      priceBlended1mTokens: 5.0,
    });
    const worst = createMockModel({
      id: "worst",
      name: "Worst Model",
      intelligenceIndex: 10,
      codingIndex: 10,
      mathIndex: 10,
      tau2: 0.1,
      ifbench: 0.1,
      lcr: 0.1,
      terminalbenchHard: 0.1,
      medianOutputTokensPerSecond: 10,
      priceBlended1mTokens: 100.0,
    });
    const rankings = calculateRankings([best, worst]);
    expect(rankings.get("worst")?.intelligence).toBe(2);
    expect(rankings.get("worst")?.coding).toBe(2);
    expect(rankings.get("worst")?.math).toBe(2);
    expect(rankings.get("worst")?.agentic).toBe(2);
    expect(rankings.get("worst")?.speed).toBe(2);
    expect(rankings.get("worst")?.price).toBe(2);
    expect(rankings.get("worst")?.value).toBe(2);
  });

  it("should handle a single model", () => {
    const model = createMockModel({ id: "only" });
    const rankings = calculateRankings([model]);
    expect(rankings.size).toBe(1);
    expect(rankings.get("only")?.intelligence).toBe(1);
    expect(rankings.get("only")?.coding).toBe(1);
    expect(rankings.get("only")?.math).toBe(1);
    expect(rankings.get("only")?.agentic).toBe(1);
    expect(rankings.get("only")?.speed).toBe(1);
    expect(rankings.get("only")?.price).toBe(1);
    expect(rankings.get("only")?.value).toBe(1);
  });

  it("should rank by price ascending (lower price = better)", () => {
    const cheap = createMockModel({
      id: "cheap",
      name: "Cheap Model",
      priceBlended1mTokens: 1.0,
    });
    const expensive = createMockModel({
      id: "expensive",
      name: "Expensive Model",
      priceBlended1mTokens: 100.0,
    });
    const rankings = calculateRankings([cheap, expensive]);
    expect(rankings.get("cheap")?.price).toBe(1);
    expect(rankings.get("expensive")?.price).toBe(2);
  });

  it("should return a Map with the correct size", () => {
    const models = [
      createMockModel({ id: "a" }),
      createMockModel({ id: "b" }),
      createMockModel({ id: "c" }),
    ];
    const rankings = calculateRankings(models);
    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toBe(3);
  });
});

describe("calculatePercentiles", () => {
  // NOTE: Percentile rank is computed on raw values.
  // 0 = lowest value, 100 = highest value.
  // For priceBlended1mTokens and medianTimeToFirstTokenSeconds,
  // lower numeric values are "better" but the percentile is based
  // on the actual value position, not the "goodness".
  const rows = [
    createMockModel({
      id: "low",
      name: "Low Value",
      intelligenceIndex: 10,
      codingIndex: 10,
      mathIndex: 10,
      medianOutputTokensPerSecond: 5,
      medianTimeToFirstTokenSeconds: 2.0,
      priceBlended1mTokens: 100,
      tau2: null,
      ifbench: null,
      lcr: null,
      terminalbenchHard: null,
    }),
    createMockModel({
      id: "mid",
      name: "Mid Value",
      intelligenceIndex: 50,
      codingIndex: 50,
      mathIndex: 50,
      medianOutputTokensPerSecond: 50,
      medianTimeToFirstTokenSeconds: 0.5,
      priceBlended1mTokens: 50,
      tau2: 0.5,
      ifbench: 0.5,
      lcr: null,
      terminalbenchHard: null,
    }),
    createMockModel({
      id: "high",
      name: "High Value",
      intelligenceIndex: 100,
      codingIndex: 100,
      mathIndex: 100,
      medianOutputTokensPerSecond: 200,
      medianTimeToFirstTokenSeconds: 0.1,
      priceBlended1mTokens: 10,
      tau2: 1.0,
      ifbench: 1.0,
      lcr: null,
      terminalbenchHard: null,
    }),
  ];

  it("should give 0 percentile to the lowest value", () => {
    const percentiles = calculatePercentiles(rows, rows[0]);
    // rows[0] has: intelligenceIndex=10 (lowest → 0), price=100 (highest → 100)
    expect(percentiles.get("intelligenceIndex")).toBe(0);
    expect(percentiles.get("codingIndex")).toBe(0);
    expect(percentiles.get("mathIndex")).toBe(0);
    expect(percentiles.get("medianOutputTokensPerSecond")).toBe(0);
    // price=100 is highest value → 100th percentile
    expect(percentiles.get("priceBlended1mTokens")).toBe(100);
    // latency=2.0 is highest value → 100th percentile
    expect(percentiles.get("medianTimeToFirstTokenSeconds")).toBe(100);
  });

  it("should give 100 percentile to the highest value", () => {
    const percentiles = calculatePercentiles(rows, rows[2]);
    // rows[2] has: intelligenceIndex=100 (highest → 100), price=10 (lowest → 0)
    expect(percentiles.get("intelligenceIndex")).toBe(100);
    expect(percentiles.get("codingIndex")).toBe(100);
    expect(percentiles.get("mathIndex")).toBe(100);
    expect(percentiles.get("medianOutputTokensPerSecond")).toBe(100);
    // price=10 is lowest value → 0th percentile
    expect(percentiles.get("priceBlended1mTokens")).toBe(0);
    // latency=0.1 is lowest value → 0th percentile
    expect(percentiles.get("medianTimeToFirstTokenSeconds")).toBe(0);
  });

  it("should give 50 percentile to the middle value", () => {
    const percentiles = calculatePercentiles(rows, rows[1]);
    expect(percentiles.get("intelligenceIndex")).toBe(50);
    expect(percentiles.get("codingIndex")).toBe(50);
    expect(percentiles.get("mathIndex")).toBe(50);
    expect(percentiles.get("medianOutputTokensPerSecond")).toBe(50);
    expect(percentiles.get("medianTimeToFirstTokenSeconds")).toBe(50);
    expect(percentiles.get("priceBlended1mTokens")).toBe(50);
  });

  it("should compute agentic percentile", () => {
    const percentiles = calculatePercentiles(rows, rows[2]);
    // rows[2] has tau2=1.0, ifbench=1.0 → agenticIndex=1.0 (highest)
    expect(percentiles.get("agenticIndex")).toBe(100);
  });

  it("should set 0 for agentic when model has no agentic benchmarks", () => {
    const percentiles = calculatePercentiles(rows, rows[0]);
    expect(percentiles.get("agenticIndex")).toBe(0);
  });

  it("should return a Map with keys for all metrics", () => {
    const percentiles = calculatePercentiles(rows, rows[1]);
    expect(percentiles).toBeInstanceOf(Map);
    expect(percentiles.get("intelligenceIndex")).toBeTypeOf("number");
    expect(percentiles.get("codingIndex")).toBeTypeOf("number");
    expect(percentiles.get("mathIndex")).toBeTypeOf("number");
    expect(percentiles.get("agenticIndex")).toBeTypeOf("number");
    expect(percentiles.get("medianOutputTokensPerSecond")).toBeTypeOf("number");
    expect(percentiles.get("medianTimeToFirstTokenSeconds")).toBeTypeOf(
      "number",
    );
    expect(percentiles.get("priceBlended1mTokens")).toBeTypeOf("number");
  });
});

describe("calculateUseCaseScores", () => {
  it("should compute all five use case scores for a well-rounded model", () => {
    const model = createMockModel({
      intelligenceIndex: 90,
      codingIndex: 85,
      mathIndex: 78,
      tau2: 0.7,
      ifbench: null,
      lcr: null,
      terminalbenchHard: null,
      medianOutputTokensPerSecond: 100,
      priceBlended1mTokens: 15.0,
    });
    const scores = calculateUseCaseScores(model);

    // Intelligence: 90*0.6 + 85*0.2 + 78*0.2 = 54 + 17 + 15.6 = 86.6
    expect(scores.intelligence).toBe(86.6);

    // Coding: 85*0.5 + 90*0.3 + 0.7*0.2 = 42.5 + 27 + 0.14 = 69.64
    expect(scores.coding).toBe(69.6);

    // Agentic: 0.7*0.6 + 85*0.2 + 90*0.2 = 0.42 + 17 + 18 = 35.42
    expect(scores.agentic).toBe(35.4);

    // Fast & cheap: speedNorm*0.4 + priceScore*0.4 + intel*0.2
    // speedNorm = min(100/2, 100) = 50
    // priceScore = min(10/15, 1)*100 = 66.666...
    // = 50*0.4 + 66.666*0.4 + 90*0.2 = 20 + 26.666 + 18 = 64.666 → 64.7
    expect(scores.fastAndCheap).toBe(64.7);

    // Balanced: 90*0.2 + 85*0.2 + 78*0.2 + 50*0.2 + 0.7*0.2
    // = 18 + 17 + 15.6 + 10 + 0.14 = 60.74 → 60.7
    expect(scores.balanced).toBe(60.7);
  });

  it("should handle model with all null indexes", () => {
    const model = createEmptyMockModel({
      intelligenceIndex: null,
      codingIndex: null,
      mathIndex: null,
      medianOutputTokensPerSecond: null,
      priceBlended1mTokens: null,
    });
    const scores = calculateUseCaseScores(model);
    expect(scores.intelligence).toBe(0);
    expect(scores.coding).toBe(0);
    expect(scores.agentic).toBe(0);
    expect(scores.fastAndCheap).toBe(0);
    expect(scores.balanced).toBe(0);
  });

  it("should return scores as numbers rounded to 1 decimal", () => {
    const model = createMockModel();
    const scores = calculateUseCaseScores(model);
    for (const key of Object.keys(scores) as (keyof typeof scores)[]) {
      expect(typeof scores[key]).toBe("number");
      const decimalPart = scores[key].toString().split(".")[1];
      if (decimalPart) {
        expect(decimalPart.length).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("getCoverageCount", () => {
  it("should count all non-null raw benchmarks", () => {
    const model = createEmptyMockModel({
      mmluPro: 88,
      livecodebench: 82,
      math500: 75,
      tau2: 0.7,
    });
    expect(getCoverageCount(model)).toBe(4); // mmluPro, livecodebench, math500, tau2
  });

  it("should return 0 when all benchmarks are null", () => {
    const model = createEmptyMockModel();
    expect(getCoverageCount(model)).toBe(0);
  });

  it("should return 12 when all benchmarks are populated", () => {
    const model = createMockModel({
      mmluPro: 100,
      gpqa: 90,
      hle: 80,
      livecodebench: 85,
      scicode: 88,
      math500: 95,
      aime: 70,
      aime25: 75,
      tau2: 0.8,
      ifbench: 0.7,
      lcr: 0.9,
      terminalbenchHard: 0.6,
    });
    expect(getCoverageCount(model)).toBe(12);
  });

  it("should not count derived index fields", () => {
    const model = createEmptyMockModel({
      intelligenceIndex: 100,
      codingIndex: 100,
      mathIndex: 100,
      mmluPro: 88,
      tau2: 0.7,
    });
    // intelligenceIndex, codingIndex, mathIndex are NOT in RAW_BENCHMARK_KEYS
    expect(getCoverageCount(model)).toBe(2); // mmluPro, tau2
  });
});
