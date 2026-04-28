import { ChevronDownIcon, Search } from 'lucide-react';
import { DASHBOARD_DATE_RANGES } from '@/pages/dashboard/dashboard-utils';
import type {
  Column,
  ColumnKey,
} from '../../pages/model-stats/model-stats-types';
import { Button } from '../button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';

type ModelStatsHeaderProps = {
  mergeMode: boolean;
  columns: Column[];
  visibleColumns: ColumnKey[];
  searchQuery: string;
  selectedDateRange: (typeof DASHBOARD_DATE_RANGES)[number]['key'];
  onToggleMergeMode: () => void;
  onToggleColumn: (key: ColumnKey) => void;
  onSearchChange: (query: string) => void;
  setSelectedDateRange: (
    range: (typeof DASHBOARD_DATE_RANGES)[number]['key'],
  ) => void;
};

export function ModelStatsHeader({
  mergeMode,
  columns,
  visibleColumns,
  searchQuery,
  onToggleMergeMode,
  onToggleColumn,
  onSearchChange,
  selectedDateRange,
  setSelectedDateRange,
}: ModelStatsHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Model Statistics</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onToggleMergeMode}>
            {mergeMode ? 'Cancel' : 'Merge Models'}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter models..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 border rounded-md text-sm w-52 bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {DASHBOARD_DATE_RANGES.map((option) => (
              <Button
                key={option.key}
                variant={
                  option.key === selectedDateRange
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedDateRange(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
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
        </div>
      </div>
    </>
  );
}