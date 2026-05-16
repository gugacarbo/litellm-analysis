import * as React from "react";
import type { DashboardDateRangeKey } from "@/lib/date-ranges";
import { getDateRangeDays } from "@/lib/date-ranges";

type FilterContextValue = {
  dateRange: DashboardDateRangeKey;
  setDateRange: (range: DashboardDateRangeKey) => void;
  rangeDays: number;
};

const DEFAULT_DATE_RANGE: DashboardDateRangeKey = "30d";

const FilterContext = React.createContext<FilterContextValue | undefined>(
  undefined,
);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] =
    React.useState<DashboardDateRangeKey>(DEFAULT_DATE_RANGE);

  const rangeDays = React.useMemo(
    () => getDateRangeDays(dateRange),
    [dateRange],
  );

  const value = React.useMemo(
    () => ({
      dateRange,
      setDateRange,
      rangeDays,
    }),
    [dateRange, rangeDays],
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
