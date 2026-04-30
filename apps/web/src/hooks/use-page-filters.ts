import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export interface PageFilters {
  model?: string;
  user?: string;
  apiKey?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UsePageFiltersReturn {
  filters: PageFilters;
  setFilter: (key: keyof PageFilters, value: string | undefined) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export function usePageFilters(): UsePageFiltersReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<PageFilters>(() => {
    return {
      model: searchParams.get("model") || undefined,
      user: searchParams.get("user") || undefined,
      apiKey: searchParams.get("apiKey") || undefined,
      status: searchParams.get("status") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };
  }, [searchParams]);

  const setFilter = useCallback(
    (key: keyof PageFilters, value: string | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(
      ([, value]) => value !== undefined && value !== "",
    );
  }, [filters]);

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
  };
}
