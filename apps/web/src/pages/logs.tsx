import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "../components/badge";
import { LogDetailDialog } from "../components/logs/log-detail-dialog";
import {
  LogsFilterCard,
  type LogsFilterValues,
} from "../components/logs/logs-filter-card";
import {
  DEFAULT_VISIBLE_LOG_COLUMNS,
  LogsTable,
} from "../components/logs/logs-table";
import type { LogColumnKey } from "../components/logs/logs-table-columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";
import { useLogs } from "../hooks/use-logs";
import { getAllModels } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type { SpendLog } from "../types/analytics";
import { LogsErrorsTab } from "./logs-errors-tab";

const AUTO_REFETCH_INTERVAL_MS = 15000;

export function LogsPage() {
  const {
    logs,
    pagination,
    loading,
    refreshing,
    error,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    setFilters,
    refetch,
  } = useLogs();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") === "errors" ? "errors" : "spend";

  const handleTabChange = (tab: string) => {
    if (tab === "errors") {
      setSearchParams({ tab: "errors" });
    } else {
      setSearchParams({});
    }
  };

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Spend & Errors</h1>
          <p className="text-sm text-muted-foreground">
            Request-level costs, usage, and latency diagnostics.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="spend">Spend Logs</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="spend" className="mt-6">
          <SpendLogsTab
            logs={logs}
            pagination={pagination}
            loading={loading}
            refreshing={refreshing}
            error={error}
            modelsQuery={modelsQuery}
            page={page}
            pageSize={pageSize}
            filters={filters}
            setPage={setPage}
            setPageSize={setPageSize}
            setFilters={setFilters}
            refetch={refetch}
          />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <LogsErrorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type SpendLogFilters = {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
};

interface SpendLogsTabProps {
  logs: SpendLog[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  modelsQuery: ReturnType<typeof useQuery<Array<{ modelName: string }>, Error>>;
  page: number;
  pageSize: number;
  filters: SpendLogFilters;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: SpendLogFilters) => void;
  refetch: () => void;
}

function SpendLogsTab({
  logs,
  pagination,
  loading,
  refreshing,
  error,
  modelsQuery,
  page,
  pageSize,
  filters,
  setPage,
  setPageSize,
  setFilters,
  refetch,
}: SpendLogsTabProps) {
  const models = useMemo(
    () => (modelsQuery.data ?? []).map((config) => config.modelName),
    [modelsQuery.data],
  );

  const [selectedLog, setSelectedLog] = useState<SpendLog | null>(null);
  const [autoRefetchEnabled, setAutoRefetchEnabled] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<LogColumnKey[]>(
    DEFAULT_VISIBLE_LOG_COLUMNS,
  );
  const [groupByModel, setGroupByModel] = useState(false);
  const [filterValues, setFilterValues] = useState<LogsFilterValues>({
    model: filters.model || "",
    user: filters.user || "",
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
  });

  useEffect(() => {
    if (!autoRefetchEnabled) return;

    const interval = window.setInterval(() => {
      void refetch();
    }, AUTO_REFETCH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [autoRefetchEnabled, refetch]);

  const handleApplyFilters = () => {
    setFilters({
      model: filterValues.model || undefined,
      user: filterValues.user || undefined,
      startDate: filterValues.startDate || undefined,
      endDate: filterValues.endDate || undefined,
    });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilterValues({
      model: "",
      user: "",
      startDate: "",
      endDate: "",
    });
    setFilters({});
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = pagination.total_pages || 1;
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const parsedPageSize = Number(newPageSize);
    if (Number.isNaN(parsedPageSize)) return;

    setPageSize(parsedPageSize);
    setPage(1);
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
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="outline">
          {pagination.total.toLocaleString("en-US")} logs
        </Badge>
        <Badge variant="outline">
          {activeFiltersCount > 0
            ? `${activeFiltersCount} active filters`
            : "No active filters"}
        </Badge>
      </div>

      <LogsFilterCard
        models={models}
        values={filterValues}
        error={
          error ||
          (modelsQuery.error instanceof Error
            ? modelsQuery.error.message
            : null)
        }
        onValuesChange={setFilterValues}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <LogsTable
        logs={logs}
        loading={loading}
        page={page}
        pageSize={pageSize}
        pagination={pagination}
        visibleColumns={visibleColumns}
        autoRefetchEnabled={autoRefetchEnabled}
        groupByModel={groupByModel}
        refreshing={refreshing}
        onSelectLog={setSelectedLog}
        onToggleColumn={handleToggleColumn}
        onAutoRefetchChange={setAutoRefetchEnabled}
        onGroupByModelChange={setGroupByModel}
        onRefetch={() => {
          void refetch();
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <LogDetailDialog
        log={selectedLog}
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      />
    </>
  );
}
