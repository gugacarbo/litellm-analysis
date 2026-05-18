import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import { useMemo } from "react";
import type { ComparisonCardData, UseCase } from "./benchmark-types";
import {
  calculateAgenticScore,
  calculateCompositeScore,
  calculatePercentiles,
  calculateRankings,
  calculateUseCaseScores,
  calculateValueScore,
  getCoverageCount,
  RAW_BENCHMARK_KEYS,
} from "./benchmark-utils";

const RAW_BENCHMARK_TOTAL = RAW_BENCHMARK_KEYS.length;

export interface UseBenchmarksDerivedResult {
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

    return compareRows.map((model) => {
      const agentic = calculateAgenticScore(model);
      const value = calculateValueScore(model);
      const compositeScore = calculateCompositeScore(model, agentic);
      const rankings = rankingsMap.get(model.id);
      const useCaseScores = calculateUseCaseScores(model);
      const percentiles = calculatePercentiles(rows, model);
      const coverageCount = getCoverageCount(model);

      return {
        model,
        agentic,
        value,
        compositeScore,
        percentiles,
        useCaseScores,
        rank: rankings ?? {
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
    cardData,
    sortedByUseCase,
    activeUseCase,
  };
}
