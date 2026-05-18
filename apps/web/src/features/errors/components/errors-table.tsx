import type { ErrorLog, PaginationMetadata } from "@lite-llm/contracts/analytics";
import type { ColumnDef, Updater, VisibilityState } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { LogsPaginationControls } from "@/features/logs/components/logs-pagination-controls";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { DataTable } from "@/shared/components/ui/data-table";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { APP_LOCALE } from "@/shared/lib/locale";
import { cn } from "@/shared/lib/utils";
import {
  buildErrorTableColumns,
  ERROR_COLUMNS,
  type ErrorColumnKey,
} from "../types/errors-table-columns";

export { DEFAULT_VISIBLE_ERROR_COLUMNS } from "../types/errors-table-columns";

type ErrorsTableProps = {
  errors: ErrorLog[];
  loading: boolean;
  refreshing: boolean;
  page: number;
  pageSize: number;
  pagination: PaginationMetadata;
  visibleColumns: ErrorColumnKey[];
  autoRefetchEnabled: boolean;
  onSelectError: (errorLog: ErrorLog) => void;
  onToggleColumn: (column: ErrorColumnKey) => void;
  onAutoRefetchChange: (enabled: boolean) => void;
  onRefetch: () => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: string) => void;
};

export function ErrorsTable({
  errors,
  loading,
  refreshing,
  page,
  pageSize,
  pagination,
  visibleColumns,
  autoRefetchEnabled,
  onSelectError,
  onToggleColumn,
  onAutoRefetchChange,
  onRefetch,
  onPageChange,
  onPageSizeChange,
}: ErrorsTableProps) {
  const isFetching = loading || refreshing;
  const isRefetching = refreshing && !loading;
  const hasAnyErrors = pagination.total > 0;

  const columns: ColumnDef<ErrorLog>[] = useMemo(
    () => buildErrorTableColumns(onSelectError),
    [onSelectError],
  );

  const visibilityState: VisibilityState = useMemo(() => {
    const state: VisibilityState = {};
    for (const col of columns) {
      if (col.id) {
        state[col.id] = visibleColumns.includes(col.id as ErrorColumnKey);
      }
    }
    state.actions = true;
    return state;
  }, [columns, visibleColumns]);

  const align: Record<string, "left" | "right" | "center"> = {
    partialTokens: "right",
    partialSpend: "right",
    actions: "right",
  };

  const handleColumnVisibilityChange = (
    updaterOrValue: Updater<VisibilityState>,
  ) => {
    const state =
      typeof updaterOrValue === "function"
        ? updaterOrValue(Object.fromEntries(columns.map((c) => [c.id, true])))
        : updaterOrValue;
    for (const col of columns) {
      if (!col.id || col.id === "actions") continue;
      const key = col.id as ErrorColumnKey;
      const currentlyVisible = visibleColumns.includes(key);
      const newVisible = state[col.id] !== false;
      if (currentlyVisible !== newVisible) {
        onToggleColumn(key);
      }
    }
  };

  const columnLabels: Record<string, string> = {};
  for (const col of ERROR_COLUMNS) {
    columnLabels[col.key] = col.label;
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Recent Errors</CardTitle>
            <CardDescription>
              {loading
                ? "Loading errors..."
                : hasAnyErrors
                  ? `${pagination.total.toLocaleString(APP_LOCALE)} matching records`
                  : "No matching errors for current filters"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <DataTable
          columns={columns}
          data={errors}
          loading={loading && errors.length === 0}
          loadingSkeletonRows={10}
          emptyMessage="No errors found."
          columnVisibility={visibilityState}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          columnLabels={columnLabels}
          align={align}
          showPagination={false}
          toolbar={
            <>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
                <Switch
                  id="errors-auto-refetch"
                  checked={autoRefetchEnabled}
                  onCheckedChange={onAutoRefetchChange}
                />
                <Label
                  htmlFor="errors-auto-refetch"
                  className="text-xs text-muted-foreground"
                >
                  Auto refetch 5s
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefetch}
                disabled={isFetching}
              >
                <RefreshCw
                  className={cn(
                    "mr-1 h-3.5 w-3.5",
                    isFetching ? "animate-spin" : "",
                  )}
                />
                {isRefetching ? "Refetching..." : "Refresh"}
              </Button>
            </>
          }
        />

        <div className="mt-4">
          <LogsPaginationControls
            page={page}
            pageSize={pageSize}
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
