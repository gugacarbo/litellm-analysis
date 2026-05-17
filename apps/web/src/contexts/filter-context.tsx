import * as React from "react";
import type { DashboardDateRangeKey } from "@/lib/date-ranges";
import { getDateRangeDays } from "@/lib/date-ranges";

type FilterContextValue = {
  dateRange: DashboardDateRangeKey;
  setDateRange: (range: DashboardDateRangeKey) => void;
  customFrom?: Date;
  customTo?: Date;
  setCustomRange: (from: Date, to: Date) => void;
  rangeDays: number;
};

const DEFAULT_DATE_RANGE: DashboardDateRangeKey = "30d";

const FilterContext = React.createContext<FilterContextValue | undefined>(
  undefined,
);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] =
    React.useState<DashboardDateRangeKey>(DEFAULT_DATE_RANGE);
  const [customFrom, setCustomFrom] = React.useState<Date | undefined>(
    undefined,
  );
  const [customTo, setCustomTo] = React.useState<Date | undefined>(undefined);

  const setCustomRange = React.useCallback((from: Date, to: Date) => {
    setDateRange("custom");
    setCustomFrom(from);
    setCustomTo(to);
  }, []);

  const rangeDays = React.useMemo(() => {
    if (dateRange === "custom") {
      if (!customFrom || !customTo) return 0;
      const diffMs = customTo.getTime() - customFrom.getTime();
      return diffMs / (1000 * 60 * 60 * 24);
    }
    return getDateRangeDays(dateRange);
  }, [dateRange, customFrom, customTo]);

  const value = React.useMemo(
    () => ({
      dateRange,
      setDateRange,
      customFrom,
      customTo,
      setCustomRange,
      rangeDays,
    }),
    [dateRange, customFrom, customTo, setCustomRange, rangeDays],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilter(): FilterContextValue {
  const context = React.useContext(FilterContext);

  if (context === undefined) {
    throw new Error("useFilter must be used within a FilterProvider");
  }

  return context;
}
