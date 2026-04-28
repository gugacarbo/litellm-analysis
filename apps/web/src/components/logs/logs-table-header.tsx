import { ChevronDownIcon, RefreshCw, SlidersHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { CardDescription, CardHeader, CardTitle } from "../card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Label } from "../label";
import { Switch } from "../switch";
import type { LogColumnKey } from "./logs-table-columns";
import { LOG_COLUMNS } from "./logs-table-columns";

type LogsTableHeaderProps = {
  loading: boolean;
  paginationTotal: number;
  groupByModel: boolean;
  autoRefetchEnabled: boolean;
  isFetching: boolean;
  visibleColumns: LogColumnKey[];
  onGroupByModelChange: (enabled: boolean) => void;
  onAutoRefetchChange: (enabled: boolean) => void;
  onRefetch: () => void;
  onToggleColumn: (column: LogColumnKey) => void;
};

export function LogsTableHeader({
  loading,
  paginationTotal,
  groupByModel,
  autoRefetchEnabled,
  isFetching,
  visibleColumns,
  onGroupByModelChange,
  onAutoRefetchChange,
  onRefetch,
  onToggleColumn,
}: LogsTableHeaderProps) {
  const hasAnyLogs = paginationTotal > 0;

  return (
    <CardHeader className="border-b">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>
            {loading
              ? "Loading logs..."
              : hasAnyLogs
                ? `${paginationTotal.toLocaleString("en-US")} matching records`
                : "No matching logs for current filters"}
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={groupByModel ? "default" : "outline"}
            size="sm"
            onClick={() => onGroupByModelChange(!groupByModel)}
          >
            <ChevronDownIcon
              className={cn(
                "mr-1 h-3.5 w-3.5 transition-transform",
                !groupByModel && "-rotate-90",
              )}
            />
            Group by Model
          </Button>
          <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
            <Switch
              id="logs-auto-refetch"
              checked={autoRefetchEnabled}
              onCheckedChange={onAutoRefetchChange}
            />
            <Label
              htmlFor="logs-auto-refetch"
              className="text-xs text-muted-foreground"
            >
              Auto refetch 15s
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
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                Columns
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LOG_COLUMNS.map((column) => {
                const checked = visibleColumns.includes(column.key);

                return (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={checked}
                    disabled={checked && visibleColumns.length === 1}
                    onCheckedChange={() => onToggleColumn(column.key)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardHeader>
  );
}
