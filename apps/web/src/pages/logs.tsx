import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/badge';
import { FeatureGate } from '../components/feature-gate';
import { LogDetailDialog } from '../components/logs/log-detail-dialog';
import {
  LogsFilterCard,
  type LogsFilterValues,
} from '../components/logs/logs-filter-card';
import {
  DEFAULT_VISIBLE_LOG_COLUMNS,
  LogsTable,
} from '../components/logs/logs-table';
import type { LogColumnKey } from '../components/logs/logs-table-columns';
import { UnavailableFeature } from '../components/unavailable-feature';
import { useLogs } from '../hooks/use-logs';
import { useServerMode } from '../hooks/use-server-mode';
import { getAllModels } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';
import type { SpendLog } from '../types/analytics';

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
  const { mode } = useServerMode();

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

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
    model: filters.model || '',
    user: filters.user || '',
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
  });

  useEffect(() => {
    if (!autoRefetchEnabled) return;

    const interval = window.setInterval(() => {
      void refetch({ background: true });
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
      model: '',
      user: '',
      startDate: '',
      endDate: '',
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

  const modeLabel =
    mode === 'database'
      ? 'Database Mode'
      : mode === 'api-only'
        ? 'API-Only Mode'
        : 'Limited Mode';

  const modeBadgeClass =
    mode === 'database'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
      : mode === 'limited'
        ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
        : 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30';

  return (
    <FeatureGate
      capability="spendLogs"
      fallback={<UnavailableFeature capability="spendLogs" />}
    >
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Spend Logs</h1>
            <p className="text-sm text-muted-foreground">
              Request-level costs, usage, and latency diagnostics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={modeBadgeClass}>
              {modeLabel}
            </Badge>
            <Badge variant="outline">
              {pagination.total.toLocaleString('en-US')} logs
            </Badge>
            <Badge variant="outline">
              {activeFiltersCount > 0
                ? `${activeFiltersCount} active filters`
                : 'No active filters'}
            </Badge>
          </div>
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
            void refetch({ background: true });
          }}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <LogDetailDialog
        log={selectedLog}
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      />
    </FeatureGate>
  );
}
