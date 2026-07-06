import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import {
  matchesBenchmarkModelSearch,
  sortBenchmarkModelsBySearch,
} from "../utils/model-search";

export function filterModels(
  query: string,
  allModels: ModelBenchmarkListItem[],
  opts?: { includeCreatorName?: boolean },
): ModelBenchmarkListItem[] {
  const needle = query.trim();
  if (!needle) return allModels.slice(0, 20);

  return sortBenchmarkModelsBySearch(
    needle,
    allModels.filter((model) =>
      matchesBenchmarkModelSearch(needle, model, opts),
    ),
    opts,
  ).slice(0, 20);
}
