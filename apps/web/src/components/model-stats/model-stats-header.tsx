import { ChevronDownIcon, Search } from "lucide-react";
import { useFilter } from "@/contexts/filter-context";
import { DASHBOARD_DATE_RANGES } from "@/pages/dashboard/dashboard-utils";
import type {
  Column,
  ColumnKey,
} from "../../pages/model-stats/model-stats-types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { ModelStatsColumnPresets } from "./model-stats-column-presets";

type ModelStatsHeaderProps = {
  columns: Column[];
  visibleColumns: ColumnKey[];
  searchQuery: string;
  matchedModelsCount: number;
  totalModelsCount: number;
  onToggleColumn: (key: ColumnKey) => void;
  onApplyColumnPreset: (columns: ColumnKey[]) => void;
  onSearchChange: (query: string) => void;
};

export function ModelStatsHeader({
  columns,
  visibleColumns,
  searchQuery,
  matchedModelsCount,
  totalModelsCount,
  onToggleColumn,
  onApplyColumnPreset,
  onSearchChange,
}: ModelStatsHeaderProps) {
  const { dateRange, setDateRange } = useFilter();

  const activeFiltersCount =
    (searchQuery.trim().length > 0 ? 1 : 0) + (dateRange === "30d" ? 0 : 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{matchedModelsCount} models shown</Badge>
        <Badge variant="outline">{totalModelsCount} total</Badge>
        <Badge variant="outline">
          {activeFiltersCount > 0
            ? `${activeFiltersCount} active filters`
            : "No active filters"}
        </Badge>
      </div>

      <div className="flex items-center justify-between flex-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative min-w-[220px] max-w-[320px] flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search model name..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-8"
            />
          </div>

          <ModelStatsColumnPresets
            visibleColumns={visibleColumns}
            onApplyPreset={onApplyColumnPreset}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex flex-wrap items-center gap-1.5">
            {DASHBOARD_DATE_RANGES.map((option) => (
              <Button
                key={option.key}
                variant={option.key === dateRange ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setDateRange(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => {
                const checked = visibleColumns.includes(column.key);

                return (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={checked}
                    disabled={checked && visibleColumns.length === 1}
                    onCheckedChange={() => onToggleColumn(column.key)}
                  >
                    {column.label || "Actions"}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
