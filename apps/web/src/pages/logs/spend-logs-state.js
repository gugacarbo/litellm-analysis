import { useEffect, useMemo, useState } from "react";
import { DEFAULT_VISIBLE_LOG_COLUMNS } from "../../components/logs/logs-table";

const AUTO_REFETCH_INTERVAL_MS = 15000;
export function useSpendLogsState(params) {
  const models = useMemo(
    () => (params.modelsQuery.data ?? []).map((config) => config.modelName),
    [params.modelsQuery.data],
  );
  const [selectedLog, setSelectedLog] = useState(null);
  const [autoRefetchEnabled, setAutoRefetchEnabled] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(
    DEFAULT_VISIBLE_LOG_COLUMNS,
  );
  const [groupByModel, setGroupByModel] = useState(false);
  const [filterValues, setFilterValues] = useState({
    model: params.filters.model || "",
    user: params.filters.user || "",
    startDate: params.filters.startDate || "",
    endDate: params.filters.endDate || "",
  });
  useEffect(() => {
    if (!autoRefetchEnabled) return;
    const interval = window.setInterval(() => {
      void params.refetch();
    }, AUTO_REFETCH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [autoRefetchEnabled, params.refetch]);
  const handleApplyFilters = () => {
    params.setFilters({
      model: filterValues.model || undefined,
      user: filterValues.user || undefined,
      startDate: filterValues.startDate || undefined,
      endDate: filterValues.endDate || undefined,
    });
    params.setPage(1);
  };
  const handleClearFilters = () => {
    setFilterValues({
      model: "",
      user: "",
      startDate: "",
      endDate: "",
    });
    params.setFilters({});
    params.setPage(1);
  };
  const handlePageChange = (newPage) => {
    const totalPages = params.pagination.total_pages || 1;
    if (newPage >= 1 && newPage <= totalPages) {
      params.setPage(newPage);
    }
  };
  const handlePageSizeChange = (newPageSize) => {
    const parsedPageSize = Number(newPageSize);
    if (Number.isNaN(parsedPageSize)) return;
    params.setPageSize(parsedPageSize);
    params.setPage(1);
  };
  const handleToggleColumn = (column) => {
    setVisibleColumns((currentColumns) => {
      if (currentColumns.includes(column)) {
        if (currentColumns.length === 1) return currentColumns;
        return currentColumns.filter((key) => key !== column);
      }
      return [...currentColumns, column];
    });
  };
  const activeFiltersCount = useMemo(
    () => Object.values(params.filters).filter(Boolean).length,
    [params.filters],
  );
  return {
    selectedLog,
    setSelectedLog,
    autoRefetchEnabled,
    setAutoRefetchEnabled,
    visibleColumns,
    groupByModel,
    setGroupByModel,
    filterValues,
    setFilterValues,
    handleApplyFilters,
    handleClearFilters,
    handlePageChange,
    handlePageSizeChange,
    handleToggleColumn,
    activeFiltersCount,
    models,
  };
}
