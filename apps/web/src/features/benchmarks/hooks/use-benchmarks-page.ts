import { useState } from "react";
import type { UseCase } from "../types/benchmark-types";
import { useBenchmarksActions } from "./use-benchmarks-actions";
import { useBenchmarksDerived } from "./use-benchmarks-derived";
import { useBenchmarksState } from "./use-benchmarks-state";

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

  const derived = useBenchmarksDerived(state.rows, selectedIds, activeUseCase);

  return {
    ...state,
    ...actions,
    ...derived,
  };
}
