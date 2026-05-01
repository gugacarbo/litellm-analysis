import { useFilter } from "@/contexts/filter-context";
import { DASHBOARD_DATE_RANGES } from "@/pages/dashboard/dashboard-utils";
import { Button } from "./button";

export function DateRangeFilter() {
  const { dateRange, setDateRange } = useFilter();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {DASHBOARD_DATE_RANGES.map((option) => (
        <Button
          key={option.key}
          variant={option.key === dateRange ? "default" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setDateRange(option.key)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
