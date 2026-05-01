import { useState } from "react";
import { useFilter } from "@/contexts/filter-context";
import {
  type ColumnKey,
  MODEL_STATS_COLUMNS,
  type SortDirection,
  type SortField,
} from "./model-stats-types";

export interface ModelStatsDialogState {
  rangeDays: number;
  sortField: SortField;
  setSortField: (v: SortField) => void;
  sortDirection: SortDirection;
  setSortDirection: (v: SortDirection) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  visibleColumns: ColumnKey[];
  setVisibleColumns: (
    v: ColumnKey[] | ((prev: ColumnKey[]) => ColumnKey[]),
  ) => void;
  mergeMode: boolean;
  setMergeMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  sourceModel: string;
  setSourceModel: (v: string) => void;
  targetModel: string;
  setTargetModel: (v: string) => void;
  merging: boolean;
  setMerging: (v: boolean) => void;
  deleting: string | null;
  setDeleting: (v: string | null) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (v: boolean) => void;
  mergeDialogOpen: boolean;
  setMergeDialogOpen: (v: boolean) => void;
}

export function useModelStatsDialogState(): ModelStatsDialogState {
  const { rangeDays } = useFilter();

  const [sortField, setSortField] = useState<SortField>("total_spend");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() =>
    MODEL_STATS_COLUMNS.filter((c) => c.default).map((c) => c.key),
  );
  const [mergeMode, setMergeMode] = useState(false);
  const [sourceModel, setSourceModel] = useState("");
  const [targetModel, setTargetModel] = useState("");
  const [merging, setMerging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  return {
    rangeDays,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    searchQuery,
    setSearchQuery,
    visibleColumns,
    setVisibleColumns,
    mergeMode,
    setMergeMode,
    sourceModel,
    setSourceModel,
    targetModel,
    setTargetModel,
    merging,
    setMerging,
    deleting,
    setDeleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    mergeDialogOpen,
    setMergeDialogOpen,
  };
}
