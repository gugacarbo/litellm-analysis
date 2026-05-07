import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getCostEfficiencyByModel,
  getModelRequestDistribution,
  getModelStatistics,
  getTokenDistribution,
} from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";
import {
  getDateRangeDays,
  getDateRangeLabel,
} from "../dashboard/dashboard-utils";
import { MODEL_STATS_COLUMNS } from "./model-stats-types";
export function useModelStatsState() {
  const [selectedDateRange, setSelectedDateRange] = useState("30d");
  const rangeDays = getDateRangeDays(selectedDateRange);
  const rangeLabel = getDateRangeLabel(selectedDateRange);
  const [sortField, setSortField] = useState("total_spend");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(() =>
    MODEL_STATS_COLUMNS.filter((c) => c.default).map((c) => c.key),
  );
  const [mergeMode, setMergeMode] = useState(false);
  const [sourceModel, setSourceModel] = useState("");
  const [targetModel, setTargetModel] = useState("");
  const [merging, setMerging] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const modelStatsQuery = useQuery({
    queryKey: queryKeys.modelStatistics(rangeDays),
    queryFn: () => getModelStatistics(rangeDays),
    refetchInterval: 30_000,
  });
  const tokenDistQuery = useQuery({
    queryKey: queryKeys.dashboardTokenDistribution(rangeDays),
    queryFn: () => getTokenDistribution(rangeDays),
    refetchInterval: 30_000,
  });
  const modelDistQuery = useQuery({
    queryKey: queryKeys.dashboardModelDistribution(rangeDays),
    queryFn: () => getModelRequestDistribution(rangeDays),
    refetchInterval: 30_000,
  });
  const costEffQuery = useQuery({
    queryKey: queryKeys.dashboardCostEfficiency(rangeDays),
    queryFn: () => getCostEfficiencyByModel(rangeDays),
    refetchInterval: 30_000,
  });
  return {
    selectedDateRange,
    setSelectedDateRange,
    rangeDays,
    rangeLabel,
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
    data: modelStatsQuery.data ?? [],
    loading: modelStatsQuery.isPending && !modelStatsQuery.data,
    error:
      modelStatsQuery.error instanceof Error
        ? modelStatsQuery.error.message
        : null,
    tokenDistribution: tokenDistQuery.data ?? [],
    modelDistribution: modelDistQuery.data ?? [],
    costEfficiency: costEffQuery.data ?? [],
  };
}
