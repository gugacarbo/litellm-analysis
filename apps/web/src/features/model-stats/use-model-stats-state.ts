import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getDateRangeLabel } from "@/features/dashboard/utils/dashboard-utils";
import { useFilter } from "@/shared/contexts/filter-context";
import {
  getCostEfficiencyByModel,
  getModelRequestDistribution,
  getModelStatistics,
  getTokenDistribution,
} from "@/shared/lib/api-client";
import { queryKeys } from "@/shared/lib/query-keys";
import type { ColumnKey, SortDirection, SortField } from "./model-stats-types";
import { MODEL_STATS_COLUMNS } from "./model-stats-types";

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

  const modelStatsQuery = useQuery({
    queryKey: queryKeys.modelStatistics(rangeDays),
    queryFn: () => getModelStatistics({ days: rangeDays }),
    refetchInterval: 30_000,
  });

  const tokenDistQuery = useQuery({
    queryKey: queryKeys.dashboardTokenDistribution(rangeDays),
    queryFn: () => getTokenDistribution({ days: rangeDays }),
    refetchInterval: 30_000,
  });

  const modelDistQuery = useQuery({
    queryKey: queryKeys.dashboardModelDistribution(rangeDays),
    queryFn: () => getModelRequestDistribution({ days: rangeDays }),
    refetchInterval: 30_000,
  });

  const costEffQuery = useQuery({
    queryKey: queryKeys.dashboardCostEfficiency(rangeDays),
    queryFn: () => getCostEfficiencyByModel({ days: rangeDays }),
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
