import type {
  ErrorLog,
  PaginationMetadata,
} from "@lite-llm/contracts/analytics";
import type {
  ColumnDef,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { APP_LOCALE } from "@/shared/lib/locale";
import { cn } from "@/shared/lib/utils";
import { LogsPaginationControls } from "../logs/logs-pagination-controls";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { DataTable } from "../ui/data-table";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { renderErrorCell } from "./errors-table-cell";
import { ERROR_COLUMNS, type ErrorColumnKey } from "./errors-table-columns";

export { DEFAULT_VISIBLE_ERROR_COLUMNS } from "./errors-table-columns";

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

  // Column definitions
  const columns: ColumnDef<ErrorLog>[] = useMemo(
    () => [
      {
        id: "time",
        accessorKey: "timestamp",
        header: () => "Time",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "time",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "status",
        accessorKey: "status_code",
        header: () => "Status",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "status",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "type",
        accessorKey: "error_type",
        header: () => "Type",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "type",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "model",
        accessorKey: "model",
        header: () => "Model",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "model",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "user",
        accessorKey: "user",
        header: () => "User",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "user",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "apiKey",
        accessorKey: "api_key",
        header: () => "API Key",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "apiKey",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "spendStatus",
        accessorKey: "spend_status",
        header: () => "Spend Status",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "spendStatus",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "message",
        accessorKey: "error_message",
        header: () => "Message",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "message",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "requestId",
        accessorKey: "id",
        header: () => "Request ID",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "requestId",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "requestKwargs",
        accessorKey: "request_kwargs",
        header: () => "Has Params",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "requestKwargs",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "partialTokens",
        accessorKey: "total_tokens",
        header: () => "Partial Tokens",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "partialTokens",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "partialSpend",
        accessorKey: "spend",
        header: () => "Partial Spend",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "partialSpend",
            onSelectError,
          }),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => "",
        cell: ({ row }) =>
          renderErrorCell({
            errorLog: row.original,
            columnKey: "actions",
            onSelectError,
          }),
      },
    ],
    [onSelectError],
  );

  // Map visible columns to VisibilityState
  const visibilityState: VisibilityState = useMemo(() => {
    const state: VisibilityState = {};
    for (const col of columns) {
      if (col.id) {
        state[col.id] = visibleColumns.includes(col.id as ErrorColumnKey);
      }
    }
    // Always show actions
    state.actions = true;
    return state;
  }, [columns, visibleColumns]);

  // Column alignment
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

  // Build label map for column visibility dropdown
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
