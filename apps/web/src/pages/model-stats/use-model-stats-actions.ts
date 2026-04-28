import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { deleteModelLogs, mergeModels } from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";
import type {
  ColumnKey,
  ModelStats,
  SortDirection,
  SortField,
} from "./model-stats-types";

type SetSortField = (f: SortField) => void;
type SetSortDirection = (d: SortDirection) => void;
type SetString = (v: string) => void;
type SetBoolean = (v: boolean) => void;
type SetDeleting = (v: string | null) => void;

export function useModelStatsActions(
  rangeDays: number,
  sortField: SortField,
  setSortField: SetSortField,
  sortDirection: SortDirection,
  setSortDirection: SetSortDirection,
  sourceModel: string,
  setSourceModel: SetString,
  targetModel: string,
  setTargetModel: SetString,
  setMerging: SetBoolean,
  deleting: string | null,
  setDeleting: SetDeleting,
  setDeleteDialogOpen: SetBoolean,
  setMergeDialogOpen: SetBoolean,
  setMergeMode: SetBoolean,
  setVisibleColumns: (
    fn: ColumnKey[] | ((prev: ColumnKey[]) => ColumnKey[]),
  ) => void,
) {
  const queryClient = useQueryClient();

  const deleteModelLogsMutation = useMutation({
    mutationFn: (modelName: string) => deleteModelLogs(modelName),
  });

  const mergeModelsMutation = useMutation({
    mutationFn: (params: { sourceModel: string; targetModel: string }) =>
      mergeModels(params.sourceModel, params.targetModel),
  });

  const handleSort = useCallback(
    (field: SortField) => {
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
    (key: ColumnKey) => {
      setVisibleColumns((prev: ColumnKey[]) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    },
    [setVisibleColumns],
  );

  const openDeleteDialog = useCallback(
    (modelName: string) => {
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
    const isUndefined = (value: string | null | undefined): boolean =>
      !value || value.trim() === "";
    try {
      await deleteModelLogsMutation.mutateAsync(modelName);
      queryClient.setQueryData<ModelStats[]>(
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
