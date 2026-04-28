import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "../../lib/query-keys";
import type { ModelStatsDialogState } from "./dialog-state";
import type { ColumnKey, ModelStats, SortField } from "./model-stats-types";
import type { useModelStatsMutations } from "./mutations";

type Mutations = ReturnType<typeof useModelStatsMutations>;

export function useModelStatsDialogHandlers(
  queryClient: QueryClient,
  state: ModelStatsDialogState,
  mutations: Mutations,
) {
  const isUndefinedModel = (value: string | null | undefined): boolean =>
    !value || value.trim() === "";

  const handleSort = (field: SortField) => {
    if (state.sortField === field) {
      state.setSortDirection(state.sortDirection === "desc" ? "asc" : "desc");
      return;
    }
    state.setSortField(field);
    state.setSortDirection(field === "model" ? "asc" : "desc");
  };

  const toggleColumn = (key: ColumnKey) => {
    state.setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const openDeleteDialog = (modelName: string) => {
    state.setDeleting(modelName);
    state.setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    const modelName = state.deleting;
    if (modelName === null) return;
    const modelLabel = modelName.trim() ? modelName : "(no model)";

    state.setDeleteDialogOpen(false);
    state.setDeleting(modelName);

    try {
      await mutations.deleteModelLogsMutation.mutateAsync(modelName);

      queryClient.setQueryData<ModelStats[]>(
        queryKeys.modelStatistics(state.rangeDays),
        (previous) => {
          const current = previous ?? [];
          return current.filter((m) =>
            modelName.trim() === ""
              ? !isUndefinedModel(m.model)
              : m.model !== modelName,
          );
        },
      );

      toast.success(`Deleted logs for model "${modelLabel}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      state.setDeleting(null);
    }
  };

  const handleMerge = async () => {
    if (!state.sourceModel || !state.targetModel) {
      toast.warning("Please select both source and target models");
      return;
    }
    if (state.sourceModel === state.targetModel) {
      toast.warning("Source and target models must be different");
      return;
    }

    state.setMergeDialogOpen(true);
  };

  const confirmMerge = async () => {
    state.setMergeDialogOpen(false);
    state.setMerging(true);

    try {
      await mutations.mergeModelsMutation.mutateAsync({
        sourceModel: state.sourceModel,
        targetModel: state.targetModel,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.modelStatistics(state.rangeDays),
      });
      state.setMergeMode(false);
      state.setSourceModel("");
      state.setTargetModel("");
      toast.success(
        `Merged logs from "${state.sourceModel}" into "${state.targetModel}"`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to merge");
    } finally {
      state.setMerging(false);
    }
  };

  return {
    handleSort,
    toggleColumn,
    openDeleteDialog,
    handleDelete,
    handleMerge,
    confirmMerge,
  };
}
