import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getModelBenchmarks } from "../../lib/api-client/benchmarks";
import type {
  BenchmarkSortDirection,
  BenchmarkSortField,
  BenchmarksDerivedState,
} from "./benchmark-types";

interface UseBenchmarksStateResult extends BenchmarksDerivedState {
  isLoading: boolean;
  error: string | null;
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  totalCount: number;
  unmatchedConfiguredModels: string[];
  configuredModelNames: string[];
  allModels: ModelBenchmarkListItem[];
  search: string;
  provider: string;
  showConfiguredOnly: boolean;
  minIntelligence: string;
  maxBlendedPrice: string;
  sortField: BenchmarkSortField;
  sortDirection: BenchmarkSortDirection;
  setSearch: (value: string) => void;
  setProvider: (value: string) => void;
  setShowConfiguredOnly: (value: boolean) => void;
  setMinIntelligence: (value: string) => void;
  setMaxBlendedPrice: (value: string) => void;
  setSortField: (value: BenchmarkSortField) => void;
  setSortDirection: (value: BenchmarkSortDirection) => void;
}

function toFilterableText(value: string): string {
  return value.trim().toLowerCase();
}

function sortRows(
  rows: ModelBenchmarkListItem[],
  sortField: BenchmarkSortField,
  sortDirection: BenchmarkSortDirection,
): ModelBenchmarkListItem[] {
  const dir = sortDirection === "asc" ? 1 : -1;

  const sorted = [...rows].sort((a, b) => {
    if (sortField === "name") {
      return dir * a.name.localeCompare(b.name);
    }
    if (sortField === "provider") {
      return dir * a.creatorName.localeCompare(b.creatorName);
    }
    if (sortField === "intelligence") {
      return dir * ((a.intelligenceIndex ?? -1) - (b.intelligenceIndex ?? -1));
    }
    if (sortField === "price") {
      return (
        dir *
        ((a.priceBlended1mTokens ?? Infinity) -
          (b.priceBlended1mTokens ?? Infinity))
      );
    }
    if (sortField === "speed") {
      return (
        dir *
        ((a.medianOutputTokensPerSecond ?? -1) -
          (b.medianOutputTokensPerSecond ?? -1))
      );
    }
    return (
      dir *
      ((a.medianTimeToFirstTokenSeconds ?? Infinity) -
        (b.medianTimeToFirstTokenSeconds ?? Infinity))
    );
  });

  return sorted;
}

export function useBenchmarksState(): UseBenchmarksStateResult {
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("all");
  const [showConfiguredOnly, setShowConfiguredOnly] = useState(true);
  const [minIntelligence, setMinIntelligence] = useState("");
  const [maxBlendedPrice, setMaxBlendedPrice] = useState("");
  const [sortField, setSortField] =
    useState<BenchmarkSortField>("intelligence");
  const [sortDirection, setSortDirection] =
    useState<BenchmarkSortDirection>("desc");

  const benchmarksQuery = useQuery({
    queryKey: ["benchmarks", "models"],
    queryFn: getModelBenchmarks,
    refetchInterval: 10 * 60_000,
  });

  const rows = benchmarksQuery.data?.models ?? [];
  const providers = useMemo(() => {
    const unique = new Set<string>();
    for (const row of rows) {
      unique.add(row.creatorName);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo<ModelBenchmarkListItem[]>(() => {
    const searchValue = toFilterableText(search);
    const minInt = Number.parseFloat(minIntelligence);
    const maxPrice = Number.parseFloat(maxBlendedPrice);

    const base = rows.filter((row) => {
      if (showConfiguredOnly && !row.isConfigured) return false;
      if (provider !== "all" && row.creatorName !== provider) return false;
      if (
        searchValue &&
        !toFilterableText(row.name).includes(searchValue) &&
        !toFilterableText(row.slug ?? "").includes(searchValue)
      ) {
        return false;
      }
      if (!Number.isNaN(minInt)) {
        if (row.intelligenceIndex === null) return false;
        if (row.intelligenceIndex < minInt) return false;
      }
      if (!Number.isNaN(maxPrice)) {
        if (row.priceBlended1mTokens === null) return false;
        if (row.priceBlended1mTokens > maxPrice) return false;
      }
      return true;
    });

    return sortRows(base, sortField, sortDirection);
  }, [
    maxBlendedPrice,
    minIntelligence,
    provider,
    rows,
    search,
    showConfiguredOnly,
    sortDirection,
    sortField,
  ]);

  const configuredCount = useMemo(
    () => rows.filter((item) => item.isConfigured).length,
    [rows],
  );

  return {
    providers,
    rows: filtered,
    configuredCount,
    allModels: rows,
    isLoading: benchmarksQuery.isPending && !benchmarksQuery.data,
    error:
      benchmarksQuery.error instanceof Error
        ? benchmarksQuery.error.message
        : null,
    source: benchmarksQuery.data?.source ?? "Artificial Analysis",
    sourceUrl:
      benchmarksQuery.data?.sourceUrl ?? "https://artificialanalysis.ai/",
    fetchedAt: benchmarksQuery.data?.fetchedAt ?? "",
    totalCount: benchmarksQuery.data?.models.length ?? 0,
    unmatchedConfiguredModels:
      benchmarksQuery.data?.unmatchedConfiguredModels ?? [],
    configuredModelNames: benchmarksQuery.data?.configuredModelNames ?? [],
    search,
    provider,
    showConfiguredOnly,
    minIntelligence,
    maxBlendedPrice,
    sortField,
    sortDirection,
    setSearch,
    setProvider,
    setShowConfiguredOnly,
    setMinIntelligence,
    setMaxBlendedPrice,
    setSortField,
    setSortDirection,
  };
}
