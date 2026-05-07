import { ChevronDownIcon } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useFilter } from "@/contexts/filter-context";
import {
  DAYS_OPTIONS,
  getDateRangeGroup,
  HOURS_OPTIONS,
} from "@/pages/dashboard/dashboard-utils";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const GROUP_LABELS = {
  hours: "Horas",
  days: "Dias",
  custom: "Personalizado",
};
function DateRangeGroupButton({ group, selectedKey, onSelect }) {
  const groupLabel = GROUP_LABELS[group];
  const isActive = getDateRangeGroup(selectedKey) === group;
  const options = group === "hours" ? HOURS_OPTIONS : DAYS_OPTIONS;
  const currentOption = options.find((o) => o.key === selectedKey);
  if (group === "custom") {
    return _jsx(Button, {
      variant: selectedKey === "custom" ? "default" : "outline",
      size: "sm",
      className: "h-7 px-2 text-xs",
      onClick: () => onSelect("custom"),
      children: groupLabel,
    });
  }
  return _jsxs(DropdownMenu, {
    children: [
      _jsx(DropdownMenuTrigger, {
        asChild: true,
        children: _jsxs(Button, {
          variant: isActive ? "default" : "outline",
          size: "sm",
          className: "h-7 px-2 text-xs gap-1",
          children: [
            currentOption?.label ?? groupLabel,
            _jsx(ChevronDownIcon, { className: "h-3 w-3" }),
          ],
        }),
      }),
      _jsx(DropdownMenuContent, {
        align: "end",
        children: options.map((option) =>
          _jsx(
            DropdownMenuItem,
            {
              onClick: () => onSelect(option.key),
              className: option.key === selectedKey ? "bg-accent" : "",
              children: option.label,
            },
            option.key,
          ),
        ),
      }),
    ],
  });
}
export function DateRangeFilter() {
  const { dateRange, setDateRange } = useFilter();
  return _jsxs("div", {
    className: "flex items-center gap-1",
    children: [
      _jsx(DateRangeGroupButton, {
        group: "hours",
        selectedKey: dateRange,
        onSelect: setDateRange,
      }),
      _jsx(DateRangeGroupButton, {
        group: "days",
        selectedKey: dateRange,
        onSelect: setDateRange,
      }),
      _jsx(DateRangeGroupButton, {
        group: "custom",
        selectedKey: dateRange,
        onSelect: setDateRange,
      }),
    ],
  });
}
