import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import { describe, expect, it } from "vitest";
import type {
  AgenticScore,
  ComparisonCardData,
  PercentileMap,
  UseCase,
  UseCaseScores,
  ValueScore,
} from "../types/benchmark-types";

describe("UseCase", () => {
  it("should accept all valid use case values", () => {
    const valid: UseCase[] = [
      "intelligence",
      "coding",
      "agentic",
      "fastAndCheap",
      "balanced",
    ];
    expect(valid).toHaveLength(5);
    expect(valid).toContain("intelligence");
    expect(valid).toContain("coding");
    expect(valid).toContain("agentic");
    expect(valid).toContain("fastAndCheap");
    expect(valid).toContain("balanced");
  });
});

describe("PercentileMap", () => {
  it("should be a Map with the correct key set and numeric values", () => {
    const map: PercentileMap = new Map([
      ["intelligenceIndex", 95],
      ["codingIndex", 88],
      ["mathIndex", 72],
      ["agenticIndex", 65],
      ["medianOutputTokensPerSecond", 120],
      ["medianTimeToFirstTokenSeconds", 0.5],
      ["priceBlended1mTokens", 3.5],
    ]);
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBe(7);
    expect(map.get("intelligenceIndex")).toBe(95);
    expect(map.get("codingIndex")).toBe(88);
    expect(map.get("mathIndex")).toBe(72);
    expect(map.get("agenticIndex")).toBe(65);
    expect(map.get("medianOutputTokensPerSecond")).toBe(120);
    expect(map.get("medianTimeToFirstTokenSeconds")).toBe(0.5);
    expect(map.get("priceBlended1mTokens")).toBe(3.5);
  });

  it("should allow partial percentile maps", () => {
    const partial: PercentileMap = new Map([["intelligenceIndex", 50]]);
    expect(partial.size).toBe(1);
  });
});

describe("UseCaseScores", () => {
  it("should have all five use case score fields as numbers", () => {
    const scores: UseCaseScores = {
      intelligence: 95,
      coding: 88,
      agentic: 65,
      fastAndCheap: 42,
      balanced: 78,
    };
    expect(scores.intelligence).toBe(95);
    expect(scores.coding).toBe(88);
    expect(scores.agentic).toBe(65);
    expect(scores.fastAndCheap).toBe(42);
    expect(scores.balanced).toBe(78);
  });

  it("should allow zero scores", () => {
    const scores: UseCaseScores = {
      intelligence: 0,
      coding: 0,
      agentic: 0,
      fastAndCheap: 0,
      balanced: 0,
    };
    expect(scores.intelligence).toBe(0);
  });
});

describe("AgenticScore", () => {
  it("should allow all null fields when no agentic benchmarks exist", () => {
    const score: AgenticScore = {
      tau2: null,
      ifbench: null,
      lcr: null,
      terminalbenchHard: null,
      agenticIndex: null,
      coverage: 0,
    };
    expect(score.coverage).toBe(0);
    expect(score.agenticIndex).toBeNull();
  });

  it("should accept partial agentic benchmark results", () => {
    const score: AgenticScore = {
      tau2: 0.85,
      ifbench: null,
      lcr: null,
      terminalbenchHard: null,
      agenticIndex: 78,
      coverage: 1,
    };
    expect(score.tau2).toBe(0.85);
    expect(score.coverage).toBe(1);
  });
});

describe("ValueScore", () => {
  it("should allow all null value scores", () => {
    const score: ValueScore = {
      intelligencePerDollar: null,
      speedPerDollar: null,
      agenticPerDollar: null,
    };
    expect(score.intelligencePerDollar).toBeNull();
  });

  it("should accept numeric value scores", () => {
    const score: ValueScore = {
      intelligencePerDollar: 45.2,
      speedPerDollar: 120.5,
      agenticPerDollar: 30.1,
    };
    expect(score.intelligencePerDollar).toBe(45.2);
    expect(score.speedPerDollar).toBe(120.5);
    expect(score.agenticPerDollar).toBe(30.1);
  });
});

describe("ComparisonCardData", () => {
  const mockModel: ModelBenchmarkListItem = {
    id: "test-model-1",
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
  };

  it("should construct a complete ComparisonCardData", () => {
    const card: ComparisonCardData = {
      model: mockModel,
      agentic: {
        tau2: 0.7,
        ifbench: null,
        lcr: null,
        terminalbenchHard: null,
        agenticIndex: 65,
        coverage: 1,
      },
      value: {
        intelligencePerDollar: 6.0,
        speedPerDollar: 15.0,
        agenticPerDollar: 4.3,
      },
      compositeScore: 82.5,
      percentiles: new Map([
        ["intelligenceIndex", 90],
        ["codingIndex", 85],
        ["mathIndex", 78],
        ["agenticIndex", 65],
        ["medianOutputTokensPerSecond", 70],
        ["medianTimeToFirstTokenSeconds", 40],
        ["priceBlended1mTokens", 55],
      ]),
      useCaseScores: {
        intelligence: 90,
        coding: 85,
        agentic: 65,
        fastAndCheap: 42,
        balanced: 78,
      },
      rank: {
        intelligence: 5,
        coding: 8,
        math: 12,
        agentic: 15,
        speed: 3,
        price: 20,
        value: 7,
      },
      coverageCount: 10,
      totalBenchmarks: 25,
    };

    expect(card.model.name).toBe("Test Model");
    expect(card.compositeScore).toBe(82.5);
    expect(card.agentic.tau2).toBe(0.7);
    expect(card.value.intelligencePerDollar).toBe(6.0);
    expect(card.rank.intelligence).toBe(5);
    expect(card.coverageCount).toBe(10);
    expect(card.totalBenchmarks).toBe(25);
    expect(card.percentiles.get("intelligenceIndex")).toBe(90);
  });

  it("should allow nullable agentic scores within ComparisonCardData", () => {
    const noAgenticCard: ComparisonCardData = {
      model: mockModel,
      agentic: {
        tau2: null,
        ifbench: null,
        lcr: null,
        terminalbenchHard: null,
        agenticIndex: null,
        coverage: 0,
      },
      value: {
        intelligencePerDollar: null,
        speedPerDollar: null,
        agenticPerDollar: null,
      },
      compositeScore: 70,
      percentiles: new Map([
        ["intelligenceIndex", 80],
        ["priceBlended1mTokens", 60],
      ]),
      useCaseScores: {
        intelligence: 80,
        coding: 0,
        agentic: 0,
        fastAndCheap: 0,
        balanced: 0,
      },
      rank: {
        intelligence: 10,
        coding: 0,
        math: 0,
        agentic: 0,
        speed: 0,
        price: 15,
        value: 0,
      },
      coverageCount: 3,
      totalBenchmarks: 25,
    };

    expect(noAgenticCard.agentic.agenticIndex).toBeNull();
    expect(noAgenticCard.value.intelligencePerDollar).toBeNull();
    expect(noAgenticCard.compositeScore).toBe(70);
  });
});
