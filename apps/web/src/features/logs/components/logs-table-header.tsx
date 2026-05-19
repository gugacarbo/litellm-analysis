import { RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { APP_LOCALE } from "@/shared/lib/locale";
import { LOG_COLUMNS, type LogColumnKey } from "./logs-table-columns";
import { cn } from "@/shared/lib/utils";

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
  return (
    <CardHeader className="border-b">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle>Request Logs</CardTitle>
          <CardDescription>
            {loading
              ? "Loading logs..."
              : paginationTotal > 0
                ? `${paginationTotal.toLocaleString(APP_LOCALE)} matching records`
                : "No logs found"}
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Group by Model */}
          <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
            <Switch
              id="logs-group-by-model"
              checked={groupByModel}
              onCheckedChange={onGroupByModelChange}
            />
            <Label
              htmlFor="logs-group-by-model"
              className="text-xs text-muted-foreground"
            >
              Group by model
            </Label>
          </div>

          {/* Auto Refetch */}
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
              Auto refetch 5s
            </Label>
          </div>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              {LOG_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  className="capitalize"
                  checked={visibleColumns.includes(col.key)}
                  onCheckedChange={() => onToggleColumn(col.key)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
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
            {isFetching ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
