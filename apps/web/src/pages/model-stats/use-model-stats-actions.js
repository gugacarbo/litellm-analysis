import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { deleteModelLogs, mergeModels } from "../../lib/api-client/models";
import { queryKeys } from "../../lib/query-keys";
export function useModelStatsActions(
  rangeDays,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  sourceModel,
  setSourceModel,
  targetModel,
  setTargetModel,
  setMerging,
  deleting,
  setDeleting,
  setDeleteDialogOpen,
  setMergeDialogOpen,
  setMergeMode,
  setVisibleColumns,
) {
  const queryClient = useQueryClient();
  const deleteModelLogsMutation = useMutation({
    mutationFn: (modelName) => deleteModelLogs(modelName),
  });
  const mergeModelsMutation = useMutation({
    mutationFn: (params) => mergeModels(params.sourceModel, params.targetModel),
  });
  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "desc" ? "asc" : "desc");
        return;
      }
      setSortField(field);
      setSortDirection(field === "model" ? "asc" : "desc");
    },
    [sortField, sortDirection, setSortField, setSortDirection],
  );
  const toggleColumn = useCallback(
    (key) => {
      setVisibleColumns((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    },
    [setVisibleColumns],
  );
  const openDeleteDialog = useCallback(
    (modelName) => {
      setDeleting(modelName);
      setDeleteDialogOpen(true);
    },
    [setDeleting, setDeleteDialogOpen],
  );
  const handleDelete = useCallback(async () => {
    const modelName = deleting;
    if (modelName === null) return;
    const modelLabel = modelName.trim() ? modelName : "(no model)";
    setDeleteDialogOpen(false);
    setDeleting(modelName);
    const isUndefined = (value) => !value || value.trim() === "";
    try {
      await deleteModelLogsMutation.mutateAsync(modelName);
      queryClient.setQueryData(
        queryKeys.modelStatistics(rangeDays),
        (previous) => {
          const current = previous ?? [];
          return current.filter((m) =>
            modelName.trim() === ""
              ? !isUndefined(m.model)
              : m.model !== modelName,
          );
        },
      );
      toast.success(`Deleted logs for model "${modelLabel}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(null);
    }
  }, [
    deleting,
    setDeleteDialogOpen,
    setDeleting,
    deleteModelLogsMutation,
    queryClient,
    rangeDays,
  ]);
  const handleMerge = useCallback(() => {
    if (!sourceModel || !targetModel) {
      toast.warning("Please select both source and target models");
      return;
    }
    if (sourceModel === targetModel) {
      toast.warning("Source and target models must be different");
      return;
    }
    setMergeDialogOpen(true);
  }, [sourceModel, targetModel, setMergeDialogOpen]);
  const confirmMerge = useCallback(async () => {
    setMergeDialogOpen(false);
    setMerging(true);
    try {
      await mergeModelsMutation.mutateAsync({ sourceModel, targetModel });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.modelStatistics(rangeDays),
      });
      setMergeMode(false);
      setSourceModel("");
      setTargetModel("");
      toast.success(`Merged logs from "${sourceModel}" into "${targetModel}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to merge");
    } finally {
      setMerging(false);
    }
  }, [
    setMerging,
    mergeModelsMutation,
    queryClient,
    rangeDays,
    setMergeMode,
    setMergeDialogOpen,
    setSourceModel,
    setTargetModel,
    sourceModel,
    targetModel,
  ]);
  return {
    handleSort,
    toggleColumn,
    openDeleteDialog,
    handleDelete,
    handleMerge,
    confirmMerge,
  };
}
