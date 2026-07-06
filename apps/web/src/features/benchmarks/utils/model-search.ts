import type { ModelBenchmarkListItem } from "@lite-llm/contracts";

function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function squashSearchText(value: string | null | undefined): string {
  return normalizeSearchText(value).replace(/[^a-z0-9]+/g, "");
}

function isSubsequenceMatch(needle: string, haystack: string): boolean {
  if (!needle) {
    return true;
  }

  let needleIndex = 0;
  for (const char of haystack) {
    if (char === needle[needleIndex]) {
      needleIndex += 1;
      if (needleIndex === needle.length) {
        return true;
      }
    }
  }

  return false;
}

function scoreTextMatch(query: string, candidate: string): number {
  const normalizedCandidate = normalizeSearchText(candidate);
  if (!normalizedCandidate) {
    return Number.NEGATIVE_INFINITY;
  }

  if (normalizedCandidate === query) {
    return 120;
  }

  if (normalizedCandidate.startsWith(query)) {
    return 90 - normalizedCandidate.length * 0.001;
  }

  const substringIndex = normalizedCandidate.indexOf(query);
  if (substringIndex >= 0) {
    return 75 - substringIndex * 0.5 - normalizedCandidate.length * 0.001;
  }

  const squashedQuery = squashSearchText(query);
  const squashedCandidate = squashSearchText(candidate);
  if (!squashedQuery || !squashedCandidate) {
    return Number.NEGATIVE_INFINITY;
  }

  if (squashedCandidate === squashedQuery) {
    return 110;
  }

  if (squashedCandidate.startsWith(squashedQuery)) {
    return 84 - squashedCandidate.length * 0.001;
  }

  const squashedSubstringIndex = squashedCandidate.indexOf(squashedQuery);
  if (squashedSubstringIndex >= 0) {
    return 68 - squashedSubstringIndex * 0.5 - squashedCandidate.length * 0.001;
  }

  if (isSubsequenceMatch(squashedQuery, squashedCandidate)) {
    return 52 - (squashedCandidate.length - squashedQuery.length) * 0.01;
  }

  return Number.NEGATIVE_INFINITY;
}

export function getBenchmarkModelSearchScore(
  query: string,
  model: Pick<ModelBenchmarkListItem, "name" | "slug" | "creatorName">,
  opts?: { includeCreatorName?: boolean },
): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const scores = [
    scoreTextMatch(normalizedQuery, model.slug ?? ""),
    scoreTextMatch(normalizedQuery, model.name),
  ];

  if (opts?.includeCreatorName) {
    scores.push(scoreTextMatch(normalizedQuery, model.creatorName));
  }

  return Math.max(...scores);
}

export function matchesBenchmarkModelSearch(
  query: string,
  model: Pick<ModelBenchmarkListItem, "name" | "slug" | "creatorName">,
  opts?: { includeCreatorName?: boolean },
): boolean {
  return (
    getBenchmarkModelSearchScore(query, model, opts) > Number.NEGATIVE_INFINITY
  );
}

export function sortBenchmarkModelsBySearch(
  query: string,
  models: ModelBenchmarkListItem[],
  opts?: { includeCreatorName?: boolean },
): ModelBenchmarkListItem[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [...models];
  }

  return [...models].sort((left, right) => {
    const scoreDiff =
      getBenchmarkModelSearchScore(normalizedQuery, right, opts) -
      getBenchmarkModelSearchScore(normalizedQuery, left, opts);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const leftSlug = normalizeSearchText(left.slug);
    const rightSlug = normalizeSearchText(right.slug);
    const slugDiff = leftSlug.localeCompare(rightSlug);
    if (slugDiff !== 0) {
      return slugDiff;
    }

    return left.name.localeCompare(right.name);
  });
}
