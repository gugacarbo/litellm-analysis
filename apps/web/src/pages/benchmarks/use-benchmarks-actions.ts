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
    (candidateIds: string[], getUseCaseScore: (id: string) => number) => {
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
