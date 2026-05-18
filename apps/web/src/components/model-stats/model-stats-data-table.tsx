import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import type {
  Column,
  ColumnKey,
  ModelStats,
  SortDirection,
  SortField,
} from "../../pages/model-stats/model-stats-types";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
  formatTokensPerSecond,
  getHealthColor,
} from "../../pages/model-stats/model-stats-utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { DataTable } from "../ui/data-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type ModelStatsDataTableProps = {
  loading: boolean;
  data: ModelStats[];
  visibleColumns: ColumnKey[];
  columnConfig: Column[];
  onToggleColumn: (key: ColumnKey) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  totalSpend: number;
  deleting: string | null;
  onSort: (field: SortField) => void;
  onDeleteClick: (modelName: string) => void;
};

function SpendBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function SortHeader({
  label,
  sortField,
  currentField,
  currentDirection,
  onSort,
}: {
  label: string;
  sortField: SortField;
  currentField: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === sortField;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => onSort(sortField)}
    >
      {label}
      {isActive ? (
        currentDirection === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

export function ModelStatsDataTable({
  loading,
  data,
  visibleColumns,
  columnConfig,
  onToggleColumn,
  sortField,
  sortDirection,
  totalSpend,
  deleting,
  onSort,
  onDeleteClick,
}: ModelStatsDataTableProps) {
  // Build column definitions
  const columns: ColumnDef<ModelStats>[] = [
    {
      id: "model",
      accessorKey: "model",
      header: () => "Model",
      cell: ({ row }) => {
        const modelName = row.original.model ?? "";
        const modelLabel = modelName.trim() ? modelName : "(no model)";
        const isDisabled = row.original.enabled === false;
        return (
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full shrink-0 ${getHealthColor(row.original.success_rate)}`}
            />
            <Link
              to={`/model-stats/${encodeURIComponent(modelName)}`}
              className={`font-medium font-mono text-xs whitespace-nowrap hover:underline ${isDisabled ? "opacity-50" : ""}`}
            >
              {modelLabel}
            </Link>
            {isDisabled && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                Disabled
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "requests",
      accessorKey: "request_count",
      header: () => (
        <SortHeader
          label="Requests"
          sortField="request_count"
          currentField={sortField}
          currentDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({ row }) => formatNumber(row.original.request_count),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "spend",
      accessorKey: "total_spend",
      header: () => (
        <SortHeader
          label="Spend"
          sortField="total_spend"
          currentField={sortField}
          currentDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({ row }) => formatCurrency(row.original.total_spend),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "percent",
      accessorFn: (row) =>
        totalSpend > 0 ? (Number(row.total_spend) / totalSpend) * 100 : 0,
      header: () => "% Total",
      cell: ({ row }) => (
        <SpendBar value={Number(row.original.total_spend)} total={totalSpend} />
      ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "tokens",
      accessorKey: "total_tokens",
      header: () => (
        <SortHeader
          label="Tokens"
          sortField="total_tokens"
          currentField={sortField}
          currentDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({ row }) => formatNumber(row.original.total_tokens),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "prompt",
      accessorKey: "prompt_tokens",
      header: () => "Prompt",
      cell: ({ row }) => formatNumber(row.original.prompt_tokens),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "output",
      accessorKey: "completion_tokens",
      header: () => "Output",
      cell: ({ row }) => formatNumber(row.original.completion_tokens),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "avgTok",
      accessorKey: "avg_tokens_per_request",
      header: () => (
        <SortHeader
          label="Avg Tok/Req"
          sortField="avg_tokens_per_request"
          currentField={sortField}
          currentDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({ row }) => formatNumber(row.original.avg_tokens_per_request),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "tokPerSec",
      accessorKey: "p50_tokens_per_second",
      header: () => "Out tok/s (p50)",
      cell: ({ row }) =>
        formatTokensPerSecond(row.original.p50_tokens_per_second),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "costPer1k",
      accessorFn: (row) =>
        Number(row.total_tokens) > 0
          ? (Number(row.total_spend) / Number(row.total_tokens)) * 1000
          : 0,
      header: () => "$/1K tok",
      cell: ({ row }) => {
        const val = row.getValue("costPer1k") as number;
        return val > 0 ? `$${val.toFixed(4)}` : "-";
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "latency",
      accessorKey: "avg_latency_ms",
      header: () => (
        <SortHeader
          label="Latency"
          sortField="avg_latency_ms"
          currentField={sortField}
          currentDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({ row }) => formatDuration(row.original.avg_latency_ms),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "p50",
      accessorKey: "p50_latency_ms",
      header: () => "Latency (p50)",
      cell: ({ row }) => formatDuration(row.original.p50_latency_ms),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "p95",
      accessorKey: "p95_latency_ms",
      header: () => "Latency (p95)",
      cell: ({ row }) => formatDuration(row.original.p95_latency_ms),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "p99",
      accessorKey: "p99_latency_ms",
      header: () => "Latency (p99)",
      cell: ({ row }) => formatDuration(row.original.p99_latency_ms),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "success",
      accessorKey: "success_rate",
      header: () => (
        <SortHeader
          label="Success"
          sortField="success_rate"
          currentField={sortField}
          currentDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({ row }) => {
        const rate = row.original.success_rate;
        return (
          <Badge
            variant={
              rate > 95 ? "default" : rate > 90 ? "secondary" : "destructive"
            }
          >
            {formatPercent(rate)}
          </Badge>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "errors",
      accessorKey: "error_count",
      header: () => (
        <SortHeader
          label="Errors"
          sortField="error_count"
          currentField={sortField}
          currentDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({ row }) => {
        const count = row.original.error_count;
        return count > 0 ? (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {formatNumber(count)}
          </span>
        ) : (
          <span className="text-muted-foreground">0</span>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "errorRate",
      accessorFn: (row) =>
        row.request_count > 0
          ? (Number(row.error_count) / Number(row.request_count)) * 100
          : 0,
      header: () => "Error Rate",
      cell: ({ row }) => formatPercent(row.getValue("errorRate") as number),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "users",
      accessorKey: "unique_users",
      header: () => "Users",
      cell: ({ row }) => formatNumber(row.original.unique_users),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "keys",
      accessorKey: "unique_api_keys",
      header: () => "API Keys",
      cell: ({ row }) => formatNumber(row.original.unique_api_keys),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "first",
      accessorKey: "first_seen",
      header: () => "First Used",
      cell: ({ row }) => formatDate(row.original.first_seen),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "last",
      accessorKey: "last_seen",
      header: () => "Last Used",
      cell: ({ row }) => formatDate(row.original.last_seen),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => "",
      cell: ({ row }) => {
        const modelName = row.original.model ?? "";
        const modelLabel = modelName.trim() ? modelName : "(no model)";
        return (
          <button
            type="button"
            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            disabled={deleting === modelName}
            onClick={() => onDeleteClick(modelName)}
            aria-label={`Delete ${modelLabel}`}
          >
            {deleting === modelName ? "⋯" : "✕"}
          </button>
        );
      },
    },
  ];

  // Map visible columns to VisibilityState
  const visibilityState: VisibilityState = {};
  for (const col of columnConfig) {
    if (col.key) {
      visibilityState[col.key] = visibleColumns.includes(col.key);
    }
  }

  // Column alignment mapping
  const align: Record<string, "left" | "right" | "center"> = {};
  for (const col of columnConfig) {
    if (col.key && col.key !== "model" && col.key !== "actions") {
      align[col.key] = "right";
    }
  }

  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="font-medium">Model Statistics</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columnConfig.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={visibleColumns.includes(col.key)}
                onCheckedChange={() => onToggleColumn(col.key)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <DataTable
          showColumnsSelector={false}
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No model statistics found."
          showPagination={false}
          columnVisibility={visibilityState}
          align={align}
        />
      </CardContent>
    </Card>
  );
}
