import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card';
import { ErrorDetailDialog } from '../components/errors/error-detail-dialog';
import {
  ErrorsFilterCard,
  type ErrorsFilterValues,
} from '../components/errors/errors-filter-card';
import {
  DEFAULT_VISIBLE_ERROR_COLUMNS,
  type ErrorColumnKey,
  ErrorsTable,
} from '../components/errors/errors-table';
import { FeatureGate } from '../components/feature-gate';
import { Skeleton } from '../components/skeleton';
import { UnavailableFeature } from '../components/unavailable-feature';
import { useErrors } from '../hooks/use-errors';
import { useServerMode } from '../hooks/use-server-mode';
import { getAllModels } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';
import type { ErrorLog, PaginationMetadata } from '../types/analytics';

const AUTO_REFETCH_INTERVAL_MS = 5000;

type ErrorFilters = {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
};

function parseStartDate(value: string): number | null {
  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function parseEndDate(value: string): number | null {
  const timestamp = new Date(`${value}T23:59:59.999`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function applyFilters(errors: ErrorLog[], filters: ErrorFilters): ErrorLog[] {
  const normalizedUserFilter = filters.user?.trim().toLowerCase();
  const startDate = filters.startDate
    ? parseStartDate(filters.startDate)
    : null;
  const endDate = filters.endDate ? parseEndDate(filters.endDate) : null;

  return errors.filter((errorLog) => {
    if (filters.model && errorLog.model !== filters.model) {
      return false;
    }

    if (normalizedUserFilter) {
      const normalizedUser = (errorLog.user || '').toLowerCase();
      if (!normalizedUser.includes(normalizedUserFilter)) {
        return false;
      }
    }

    if (startDate !== null || endDate !== null) {
      const errorTime = new Date(errorLog.timestamp).getTime();
      if (Number.isNaN(errorTime)) {
        return false;
      }

      if (startDate !== null && errorTime < startDate) {
        return false;
      }

      if (endDate !== null && errorTime > endDate) {
        return false;
      }
    }

    return true;
  });
}

export function ErrorsPage() {
  return (
    <FeatureGate
      capability="errorLogs"
      fallback={<UnavailableFeature capability="errorLogs" />}
    >
      <ErrorsContent />
    </FeatureGate>
  );
}

function ErrorsContent() {
  const { errors, loading, refreshing, error, refetch } = useErrors();
  const { mode } = useServerMode();

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const models = useMemo(
    () => (modelsQuery.data ?? []).map((config) => config.modelName),
    [modelsQuery.data],
  );

  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [autoRefetchEnabled, setAutoRefetchEnabled] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<ErrorFilters>({});
  const [visibleColumns, setVisibleColumns] = useState<ErrorColumnKey[]>(
    DEFAULT_VISIBLE_ERROR_COLUMNS,
  );
  const [filterValues, setFilterValues] = useState<ErrorsFilterValues>({
    model: '',
    user: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!autoRefetchEnabled) return;

    const interval = window.setInterval(() => {
      void refetch({ background: true });
    }, AUTO_REFETCH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [autoRefetchEnabled, refetch]);

  const filteredErrors = useMemo(
    () => applyFilters(errors, filters),
    [errors, filters],
  );

  const pagination = useMemo<PaginationMetadata>(
    () => ({
      total: filteredErrors.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(filteredErrors.length / pageSize),
    }),
    [filteredErrors.length, page, pageSize],
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredErrors.length / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredErrors.length, page, pageSize]);

  const paginatedErrors = useMemo(() => {
    const offset = (page - 1) * pageSize;
    return filteredErrors.slice(offset, offset + pageSize);
  }, [filteredErrors, page, pageSize]);

  const totals = useMemo(() => {
    return {
      total: filteredErrors.length,
      serverErrors: filteredErrors.filter((entry) => entry.status_code >= 500)
        .length,
      clientErrors: filteredErrors.filter(
        (entry) => entry.status_code >= 400 && entry.status_code < 500,
      ).length,
      uniqueModels: new Set(filteredErrors.map((entry) => entry.model)).size,
    };
  }, [filteredErrors]);

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

  const handleToggleColumn = (column: ErrorColumnKey) => {
    setVisibleColumns((currentColumns) => {
      if (currentColumns.includes(column)) {
        if (currentColumns.length === 1) return currentColumns;
        return currentColumns.filter((key) => key !== column);
      }
      return [...currentColumns, column];
    });
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Error Logs</h1>
            <p className="text-sm text-muted-foreground">
              Failed requests and exception diagnostics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={modeBadgeClass}>
              {modeLabel}
            </Badge>
            <Badge variant="outline">
              {pagination.total.toLocaleString('en-US')} errors
            </Badge>
            <Badge variant="outline">
              {activeFiltersCount > 0
                ? `${activeFiltersCount} active filters`
                : 'No active filters'}
            </Badge>
          </div>
        </div>

        <ErrorsFilterCard
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{totals.total}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">5xx Errors</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold text-red-600">
                  {totals.serverErrors}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">4xx Errors</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold text-amber-600">
                  {totals.clientErrors}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{totals.uniqueModels}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <ErrorsTable
          errors={paginatedErrors}
          loading={loading}
          refreshing={refreshing}
          page={page}
          pageSize={pageSize}
          pagination={pagination}
          visibleColumns={visibleColumns}
          autoRefetchEnabled={autoRefetchEnabled}
          onSelectError={setSelectedError}
          onToggleColumn={handleToggleColumn}
          onAutoRefetchChange={setAutoRefetchEnabled}
          onRefetch={() => {
            void refetch({ background: true });
          }}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <ErrorDetailDialog
        errorLog={selectedError}
        open={selectedError !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedError(null);
        }}
      />
    </>
  );
}
