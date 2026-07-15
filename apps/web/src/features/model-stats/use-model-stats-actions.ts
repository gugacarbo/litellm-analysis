import { useCallback } from "react";
import type { ColumnKey, SortDirection, SortField } from "./model-stats-types";

type SetSortField = (f: SortField) => void;
type SetSortDirection = (d: SortDirection) => void;

export function useModelStatsActions(
  sortField: SortField,
  setSortField: SetSortField,
  sortDirection: SortDirection,
  setSortDirection: SetSortDirection,
  setVisibleColumns: (
    fn: ColumnKey[] | ((prev: ColumnKey[]) => ColumnKey[]),
  ) => void,
) {

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "desc" ? "asc" : "desc");
        return;
      }
      setSortField(field);
      setSortDirection(field === "model" ? "asc" : "desc");
    },
    [sortField, sortDirection, setSortField, setSortDirection],
  );

  const toggleColumn = useCallback(
    (key: ColumnKey) => {
      setVisibleColumns((prev: ColumnKey[]) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    },
    [setVisibleColumns],
  );

  return {
    handleSort,
    toggleColumn,
  };
}
