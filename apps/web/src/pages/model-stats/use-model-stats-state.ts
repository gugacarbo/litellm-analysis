import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getCostEfficiencyByModel,
  getModelRequestDistribution,
  getModelStatistics,
  getTokenDistribution,
} from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";
import { getDateRangeLabel } from "../dashboard/dashboard-utils";
import type { ColumnKey, SortDirection, SortField } from "./model-stats-types";
import { MODEL_STATS_COLUMNS } from "./model-stats-types";
import { useFilter } from "../../contexts/filter-context";

export function useModelStatsState() {
  const {
    dateRange: selectedDateRange,
    setDateRange: setSelectedDateRange,
    rangeDays,
  } = useFilter();
  const rangeLabel = getDateRangeLabel(selectedDateRange);

  const [sortField, setSortField] = useState<SortField>("total_spend");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() =>
    MODEL_STATS_COLUMNS.filter((c) => c.default).map((c) => c.key),
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
    deleting,
    setDeleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
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
