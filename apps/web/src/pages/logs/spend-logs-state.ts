import { useEffect, useMemo, useState } from "react";
import type { LogsFilterValues } from "../../components/logs/logs-filter-card";
import { DEFAULT_VISIBLE_LOG_COLUMNS } from "../../components/logs/logs-table";
import type { LogColumnKey } from "../../components/logs/logs-table-columns";
import type { SpendLog } from "../../types/analytics";

const AUTO_REFETCH_INTERVAL_MS = 15000;

export type SpendLogFilters = {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
};

export interface SpendLogsState {
  selectedLog: SpendLog | null;
  setSelectedLog: (log: SpendLog | null) => void;
  autoRefetchEnabled: boolean;
  setAutoRefetchEnabled: (v: boolean) => void;
  visibleColumns: LogColumnKey[];
  groupByModel: boolean;
  setGroupByModel: (v: boolean) => void;
  filterValues: LogsFilterValues;
  setFilterValues: (v: LogsFilterValues) => void;
  handleApplyFilters: () => void;
  handleClearFilters: () => void;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: string) => void;
  handleToggleColumn: (column: LogColumnKey) => void;
  activeFiltersCount: number;
  models: string[];
}

export function useSpendLogsState(params: {
  filters: SpendLogFilters;
  pagination: { total_pages: number };
  modelsQuery: { data?: Array<{ modelName: string }> };
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: SpendLogFilters) => void;
  refetch: () => void;
}): SpendLogsState {
  const models = useMemo(
    () => (params.modelsQuery.data ?? []).map((config) => config.modelName),
    [params.modelsQuery.data],
  );

  const [selectedLog, setSelectedLog] = useState<SpendLog | null>(null);
  const [autoRefetchEnabled, setAutoRefetchEnabled] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<LogColumnKey[]>(
    DEFAULT_VISIBLE_LOG_COLUMNS,
  );
  const [groupByModel, setGroupByModel] = useState(false);
  const [filterValues, setFilterValues] = useState<LogsFilterValues>({
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

  const handlePageChange = (newPage: number) => {
    const totalPages = params.pagination.total_pages || 1;
    if (newPage >= 1 && newPage <= totalPages) {
      params.setPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const parsedPageSize = Number(newPageSize);
    if (Number.isNaN(parsedPageSize)) return;
    params.setPageSize(parsedPageSize);
    params.setPage(1);
  };

  const handleToggleColumn = (column: LogColumnKey) => {
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
