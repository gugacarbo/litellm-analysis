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

  const {
    handleSort,
    toggleColumn,
    openDeleteDialog,
    handleDelete,
    handleMerge,
    confirmMerge,
  } = useModelStatsActions(
    state.rangeDays,
    state.sortField,
    state.setSortField,
    state.sortDirection,
    state.setSortDirection,
    state.sourceModel,
    state.setSourceModel,
    state.targetModel,
    state.setTargetModel,
    state.setMerging,
    state.deleting,
    state.setDeleting,
    state.setDeleteDialogOpen,
    state.setMergeDialogOpen,
    state.setMergeMode,
    state.setVisibleColumns,
  );

  return {
    ...state,
    ...derived,
    handleSort,
    toggleColumn,
    openDeleteDialog,
    handleDelete,
    handleMerge,
    confirmMerge,
  };
}
