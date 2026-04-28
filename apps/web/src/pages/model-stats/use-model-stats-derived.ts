import { useMemo } from "react";
import type { ModelStats, SortDirection, SortField } from "./model-stats-types";

export function useModelStatsDerived(
  data: ModelStats[],
  searchQuery: string,
  sortField: SortField,
  sortDirection: SortDirection,
) {
  const filteredData = useMemo(
    () =>
      data.filter((m) => {
        const modelName = m.model ?? "";
        return modelName.toLowerCase().includes(searchQuery.toLowerCase());
      }),
    [data, searchQuery],
  );

  const sortedData = useMemo(
    () =>
      [...filteredData].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortDirection === "asc"
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }),
    [filteredData, sortField, sortDirection],
  );

  const totalSpend = useMemo(
    () => data.reduce((sum, m) => sum + Number(m.total_spend), 0),
    [data],
  );

  const totalRequests = useMemo(
    () => data.reduce((sum, m) => sum + Number(m.request_count), 0),
    [data],
  );

  const totalTokens = useMemo(
    () => data.reduce((sum, m) => sum + Number(m.total_tokens), 0),
    [data],
  );

  const avgSuccessRate = useMemo(
    () =>
      totalRequests > 0
        ? data.reduce(
            (sum, m) => sum + Number(m.success_rate) * Number(m.request_count),
            0,
          ) / totalRequests
        : 0,
    [data, totalRequests],
  );

  return {
    filteredData,
    sortedData,
    totalSpend,
    totalRequests,
    totalTokens,
    avgSuccessRate,
  };
}
