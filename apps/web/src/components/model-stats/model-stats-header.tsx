import { ChevronDownIcon } from "lucide-react";
import type {
  Column,
  ColumnKey,
} from "../../pages/model-stats/model-stats-types";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";

type ModelStatsHeaderProps = {
  mergeMode: boolean;
  columns: Column[];
  visibleColumns: ColumnKey[];
  searchQuery: string;
  onToggleMergeMode: () => void;
  onToggleColumn: (key: ColumnKey) => void;
  onSearchChange: (query: string) => void;
};

export function ModelStatsHeader({
  mergeMode,
  columns,
  visibleColumns,
  searchQuery,
  onToggleMergeMode,
  onToggleColumn,
  onSearchChange,
}: ModelStatsHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Model Statistics</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">30-day period</Badge>
          <Button size="sm" variant="outline" onClick={onToggleMergeMode}>
            {mergeMode ? "Cancel" : "Merge Models"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          All Models (30-day detailed stats)
        </h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
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
          <input
            type="text"
            placeholder="Filter models..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm w-48"
          />
        </div>
      </div>
    </>
  );
}
