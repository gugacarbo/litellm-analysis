import { useMemo } from "react";
import type { EvalRunListItem } from "../../lib/api-client/prompt-evals.js";
import type { SortDirection, SortField } from "./types.js";

export function usePromptEvalsDerived(
  runs: EvalRunListItem[],
  sortField: SortField,
  sortDirection: SortDirection,
) {
  const sortedRuns = useMemo(() => {
    const sorted = [...runs];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "startedAt":
          cmp = a.startedAt - b.startedAt;
          break;
        case "macroF1":
          cmp = (a.macroF1 ?? -1) - (b.macroF1 ?? -1);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "model":
          cmp = a.model.localeCompare(b.model);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [runs, sortField, sortDirection]);

  return { sortedRuns };
}
