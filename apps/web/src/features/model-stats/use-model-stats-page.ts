import { useModelStatsActions } from "./use-model-stats-actions";
import { useModelStatsDerived } from "./use-model-stats-derived";
import { useModelStatsState } from "./use-model-stats-state";

export function useModelStatsPageState() {
  const state = useModelStatsState();

  const derived = useModelStatsDerived(
    state.data,
    state.searchQuery,
    state.sortField,
    state.sortDirection,
  );

  const { handleSort, toggleColumn } = useModelStatsActions(
    state.sortField,
    state.setSortField,
    state.sortDirection,
    state.setSortDirection,
    state.setVisibleColumns,
  );

  return {
    ...state,
    ...derived,
    handleSort,
    toggleColumn,
  };
}
