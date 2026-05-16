import { ChevronDownIcon } from "lucide-react";
import { useFilter } from "@/contexts/filter-context";
import type { DashboardDateRangeKey, DateRangeGroup } from "@/lib/date-ranges";
import {
  DAYS_OPTIONS,
  getDateRangeGroup,
  HOURS_OPTIONS,
} from "@/lib/date-ranges";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const GROUP_LABELS: Record<DateRangeGroup, string> = {
  hours: "Horas",
  days: "Dias",
  custom: "Personalizado",
};

function DateRangeGroupButton({
  group,
  selectedKey,
  onSelect,
}: {
  group: DateRangeGroup;
  selectedKey: DashboardDateRangeKey;
  onSelect: (key: DashboardDateRangeKey) => void;
}) {
  const groupLabel = GROUP_LABELS[group];
  const isActive = getDateRangeGroup(selectedKey) === group;
  const options = group === "hours" ? HOURS_OPTIONS : DAYS_OPTIONS;
  const currentOption = options.find((o) => o.key === selectedKey);

  if (group === "custom") {
    return (
      <Button
        variant={selectedKey === "custom" ? "default" : "outline"}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onSelect("custom")}
      >
        {groupLabel}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs gap-1"
        >
          {currentOption?.label ?? groupLabel}
          <ChevronDownIcon className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.key}
            onClick={() => onSelect(option.key)}
            className={option.key === selectedKey ? "bg-accent" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DateRangeFilter() {
  const { dateRange, setDateRange } = useFilter();

  return (
    <div className="flex items-center gap-1">
      <DateRangeGroupButton
        group="hours"
        selectedKey={dateRange}
        onSelect={setDateRange}
      />
      <DateRangeGroupButton
        group="days"
        selectedKey={dateRange}
        onSelect={setDateRange}
      />
      <DateRangeGroupButton
        group="custom"
        selectedKey={dateRange}
        onSelect={setDateRange}
      />
    </div>
  );
}
