import type {
  PaginationMetadata,
  SpendLog,
} from "@lite-llm/api-contracts/analytics";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Filter, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import { getSpendLogs } from "../../lib/api-client/spend";
import { queryKeys } from "../../lib/query-keys";
import { LogDetailDialog } from "../logs/log-detail-dialog";
import { LogsSummaryCards } from "../logs/logs-summary-cards";
import { DEFAULT_VISIBLE_LOG_COLUMNS, LogsTable } from "../logs/logs-table";
import type { LogColumnKey } from "../logs/logs-table-columns";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type ModelLogFilters = {
  user: string;
  startDate: string;
  endDate: string;
};

type ModelDetailLogsPanelProps = {
  modelName: string;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
};

const DEFAULT_PAGE_SIZE = 25;
const AUTO_REFETCH_MS = 15_000;

const EMPTY_PAGINATION: PaginationMetadata = {
  total: 0,
  page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total_pages: 0,
};

function toLocalDateString(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(APP_LOCALE, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: APP_TIMEZONE,
  }).split("/").reverse().join("-");
}

function normalizeDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return toLocalDateString(value);
}

export function ModelDetailLogsPanel({
  modelName,
  defaultStartDate,
  defaultEndDate,
}: ModelDetailLogsPanelProps) {
  const initialFilters = useMemo<ModelLogFilters>(
    () => ({
      user: "",
      startDate: normalizeDateInput(defaultStartDate),
      endDate: normalizeDateInput(defaultEndDate),
    }),
    [defaultStartDate, defaultEndDate],
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draftFilters, setDraftFilters] =
    useState<ModelLogFilters>(initialFilters);
  const [filters, setFilters] = useState<ModelLogFilters>(initialFilters);
  const [selectedLog, setSelectedLog] = useState<SpendLog | null>(null);
  const [autoRefetchEnabled, setAutoRefetchEnabled] = useState(true);
  const [groupByModel, setGroupByModel] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<LogColumnKey[]>(
    DEFAULT_VISIBLE_LOG_COLUMNS,
  );
  const previousModelRef = useRef(modelName);

  useEffect(() => {
    const modelChanged = previousModelRef.current !== modelName;

    if (modelChanged) {
      const resetFilters: ModelLogFilters = {
        user: "",
        startDate: initialFilters.startDate,
        endDate: initialFilters.endDate,
      };
      setDraftFilters(resetFilters);
      setFilters(resetFilters);
      setSelectedLog(null);
      setPage(1);
      previousModelRef.current = modelName;
      return;
    }

    setDraftFilters((current) => ({
      ...current,
      startDate: initialFilters.startDate,
      endDate: initialFilters.endDate,
    }));
    setFilters((current) => ({
      ...current,
      startDate: initialFilters.startDate,
      endDate: initialFilters.endDate,
    }));
    setPage(1);
  }, [modelName, initialFilters.endDate, initialFilters.startDate]);

  const activeFiltersCount = [
    filters.user,
    filters.startDate,
    filters.endDate,
  ].filter((value) => value.length > 0).length;

  const logsQuery = useQuery({
    queryKey: queryKeys.spendLogs({
      page,
      pageSize,
      model: modelName,
      user: filters.user || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }),
    queryFn: () => {
      const offset = (page - 1) * pageSize;
      return getSpendLogs({
        model: modelName,
        user: filters.user || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: pageSize,
        offset,
      });
    },
    refetchInterval: autoRefetchEnabled ? AUTO_REFETCH_MS : false,
    enabled: modelName.length > 0,
  });

  const logs = logsQuery.data?.logs ?? [];
  const pagination = logsQuery.data?.pagination ?? EMPTY_PAGINATION;
  const loading = logsQuery.isPending && !logsQuery.data;
  const refreshing = logsQuery.isFetching && !loading;
  const error = logsQuery.error instanceof Error ? logsQuery.error.message : "";

  const handleToggleColumn = (column: LogColumnKey) => {
    setVisibleColumns((currentColumns) => {
      if (currentColumns.includes(column)) {
        if (currentColumns.length === 1) return currentColumns;
        return currentColumns.filter((key) => key !== column);
      }
      return [...currentColumns, column];
    });
  };

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    const cleared: ModelLogFilters = {
      user: "",
      startDate: initialFilters.startDate,
      endDate: initialFilters.endDate,
    };
    setDraftFilters(cleared);
    setFilters(cleared);
    setPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    const nextSize = Number(value);
    if (Number.isNaN(nextSize)) return;
    setPageSize(nextSize);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    const totalPages = pagination.total_pages || 1;
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Model: {modelName}</Badge>
        <Badge variant="outline">
          {pagination.total.toLocaleString(APP_LOCALE)} logs
        </Badge>
        <Badge variant="outline">
          {activeFiltersCount > 0
            ? `${activeFiltersCount} active filters`
            : "No active filters"}
        </Badge>
      </div>

      <LogsSummaryCards logs={logs} loading={loading} />

      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label
                htmlFor="model-detail-logs-user-filter"
                className="inline-flex items-center gap-1"
              >
                <User className="h-3.5 w-3.5" />
                User
              </Label>
              <Input
                id="model-detail-logs-user-filter"
                placeholder="user id"
                value={draftFilters.user}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    user: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="model-detail-logs-start-date"
                className="inline-flex items-center gap-1"
              >
                <Calendar className="h-3.5 w-3.5" />
                Start date
              </Label>
              <Input
                id="model-detail-logs-start-date"
                type="date"
                value={draftFilters.startDate}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="model-detail-logs-end-date"
                className="inline-flex items-center gap-1"
              >
                <Calendar className="h-3.5 w-3.5" />
                End date
              </Label>
              <Input
                id="model-detail-logs-end-date"
                type="date"
                value={draftFilters.endDate}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-end gap-2">
              <Button className="flex-1" onClick={handleApplyFilters}>
                <Filter className="h-4 w-4" />
                Apply
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <LogsTable
        logs={logs}
        loading={loading}
        refreshing={refreshing}
        page={page}
        pageSize={pageSize}
        pagination={pagination}
        visibleColumns={visibleColumns}
        autoRefetchEnabled={autoRefetchEnabled}
        groupByModel={groupByModel}
        onSelectLog={setSelectedLog}
        onToggleColumn={handleToggleColumn}
        onAutoRefetchChange={setAutoRefetchEnabled}
        onGroupByModelChange={setGroupByModel}
        onRefetch={() => {
          void logsQuery.refetch();
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
    </div>
  );
}
