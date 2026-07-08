import type {
  ModelBenchmarkApiResponse,
  PaginationMetadata,
} from "@lite-llm/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { ApiError } from "@/shared/lib/api-client/core";

export type BenchmarkSortField =
  | "name"
  | "provider"
  | "intelligence"
  | "price"
  | "speed"
  | "latency";

export type BenchmarkSortDirection = "asc" | "desc";

export interface BenchmarkFilters {
  search: string;
  provider: string;
  minIntelligence: string;
  maxPrice: string;
  configuredOnly: boolean;
}

export interface UseBenchmarksPaginatedOptions {
  queryKeyPrefix: ("benchmarks" | "openrouter-benchmarks")[];
  fetcher: (params: URLSearchParams) => Promise<ModelBenchmarkApiResponse>;
  datasetMissingCode?: string;
  defaultSortField?: BenchmarkSortField;
  defaultConfiguredOnly?: boolean;
}

const DEFAULT_PAGE_SIZE = 25;

function buildSearchParams(
  filters: BenchmarkFilters,
  sortField: BenchmarkSortField,
  sortDirection: BenchmarkSortDirection,
  page: number,
  pageSize: number,
): URLSearchParams {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.provider && filters.provider !== "all") {
    params.set("provider", filters.provider);
  }
  const minInt = Number.parseFloat(filters.minIntelligence);
  if (!Number.isNaN(minInt)) {
    params.set("min_intelligence", String(minInt));
  }
  const maxPrice = Number.parseFloat(filters.maxPrice);
  if (!Number.isNaN(maxPrice)) {
    params.set("max_price", String(maxPrice));
  }
  if (filters.configuredOnly) {
    params.set("configuredOnly", "true");
  }

  params.set("sort_field", sortField);
  params.set("sort_direction", sortDirection);

  return params;
}

export function useBenchmarksPaginated(options: UseBenchmarksPaginatedOptions) {
  const {
    queryKeyPrefix,
    fetcher,
    datasetMissingCode = "BENCHMARK_DATASET_MISSING",
    defaultSortField,
    defaultConfiguredOnly,
  } = options;
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<BenchmarkFilters>({
    search: "",
    provider: "all",
    minIntelligence: "",
    maxPrice: "",
    configuredOnly: defaultConfiguredOnly ?? true,
  });
  const [sortField, setSortField] = useState<BenchmarkSortField>(
    defaultSortField ?? "intelligence",
  );
  const [sortDirection, setSortDirection] =
    useState<BenchmarkSortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [appliedSort, setAppliedSort] = useState({
    sortField,
    sortDirection,
  });

  const searchParams = useMemo(
    () =>
      buildSearchParams(
        appliedFilters,
        appliedSort.sortField,
        appliedSort.sortDirection,
        page,
        pageSize,
      ),
    [appliedFilters, appliedSort, page, pageSize],
  );

  const query = useQuery({
    queryKey: [...queryKeyPrefix, "list", searchParams.toString()],
    queryFn: () => fetcher(searchParams),
    placeholderData: (previous) => previous,
  });

  const data = query.data;
  const rows = data?.models ?? [];
  const pagination: PaginationMetadata = data?.pagination ?? {
    total: 0,
    page: 1,
    page_size: pageSize,
    total_pages: 0,
  };
  const providers = useMemo(() => {
    const unique = new Set<string>();
    for (const row of data?.models ?? []) {
      unique.add(row.creatorName);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [data?.models]);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setAppliedSort({ sortField, sortDirection });
    setPage(1);
  }, [filters, sortField, sortDirection]);

  const resetFilters = useCallback(() => {
    const reset: BenchmarkFilters = {
      search: "",
      provider: "all",
      minIntelligence: "",
      maxPrice: "",
      configuredOnly: defaultConfiguredOnly ?? true,
    };
    setFilters(reset);
    setAppliedFilters(reset);
    setSortField(defaultSortField ?? "intelligence");
    setSortDirection("desc");
    setAppliedSort({
      sortField: defaultSortField ?? "intelligence",
      sortDirection: "desc",
    });
    setPage(1);
  }, [defaultConfiguredOnly, defaultSortField]);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const error =
    query.error instanceof ApiError && query.error.code === datasetMissingCode
      ? null
      : query.error instanceof Error
        ? query.error.message
        : null;
  const isDatasetMissing =
    query.error instanceof ApiError && query.error.code === datasetMissingCode;

  const updateFilter = useCallback(
    <K extends keyof BenchmarkFilters>(key: K, value: BenchmarkFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return {
    filters,
    sortField,
    sortDirection,
    page,
    pageSize,
    appliedFilters,
    rows,
    pagination,
    providers,
    isLoading: query.isPending && !query.data,
    isFetching: query.isFetching,
    error,
    isDatasetMissing,
    data,
    setFilter: updateFilter,
    setSortField,
    setSortDirection,
    applyFilters,
    resetFilters,
    goToPage,
    changePageSize,
    invalidate: useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
    }, [queryClient, queryKeyPrefix]),
  };
}
