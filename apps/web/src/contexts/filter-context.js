import * as React from "react";
import { jsx as _jsx } from "react/jsx-runtime";
import { getDateRangeDays } from "@/pages/dashboard/dashboard-utils";

const DEFAULT_DATE_RANGE = "30d";
const FilterContext = React.createContext(undefined);
export function FilterProvider({ children }) {
  const [dateRange, setDateRange] = React.useState(DEFAULT_DATE_RANGE);
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
  return _jsx(FilterContext.Provider, { value: value, children: children });
}
export function useFilter() {
  const context = React.useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}
