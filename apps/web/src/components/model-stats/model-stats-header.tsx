import { Search } from "lucide-react";
import { DASHBOARD_DATE_RANGES } from "@/pages/dashboard/dashboard-utils";
import { Button } from "../ui/button";

type ModelStatsHeaderProps = {
  searchQuery: string;
  selectedDateRange: (typeof DASHBOARD_DATE_RANGES)[number]["key"];
  onSearchChange: (query: string) => void;
  setSelectedDateRange: (
    range: (typeof DASHBOARD_DATE_RANGES)[number]["key"],
  ) => void;
};

export function ModelStatsHeader({
  searchQuery,
  onSearchChange,
  selectedDateRange,
  setSelectedDateRange,
}: ModelStatsHeaderProps) {
  return (
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
              variant={option.key === selectedDateRange ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedDateRange(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
