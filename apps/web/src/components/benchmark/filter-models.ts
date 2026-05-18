import type { ModelBenchmarkListItem } from "@lite-llm/contracts";

export function filterModels(
  query: string,
  allModels: ModelBenchmarkListItem[],
  opts?: { includeCreatorName?: boolean },
): ModelBenchmarkListItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return allModels.slice(0, 20);
  return allModels
    .filter((m) => {
      const slugMatch = (m.slug ?? "").toLowerCase().includes(needle);
      const nameMatch = m.name.toLowerCase().includes(needle);
      const creatorMatch =
        opts?.includeCreatorName &&
        m.creatorName.toLowerCase().includes(needle);
      return slugMatch || nameMatch || creatorMatch;
    })
    .slice(0, 20);
}
