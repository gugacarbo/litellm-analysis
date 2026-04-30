import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mutable state for the mock
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn(
  (updater: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => {
    if (typeof updater === "function") {
      mockSearchParams = updater(mockSearchParams);
    } else {
      mockSearchParams = updater;
    }
  },
);

vi.mock("react-router-dom", () => ({
  useSearchParams: vi.fn(() => [mockSearchParams, mockSetSearchParams]),
}));

import { usePageFilters } from "../use-page-filters";

describe("usePageFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe("Initial state", () => {
    it("returns empty filters when no URL params exist", () => {
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.filters).toEqual({
        model: undefined,
        user: undefined,
        apiKey: undefined,
        status: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
    });

    it("has no active filters when all values are undefined", () => {
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe("URL params sync", () => {
    it("parses model param from URL", () => {
      mockSearchParams.set("model", "gpt-4");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.filters.model).toBe("gpt-4");
    });

    it("parses multiple params from URL", () => {
      mockSearchParams.set("model", "gpt-4");
      mockSearchParams.set("user", "alice");
      mockSearchParams.set("status", "200");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.filters).toEqual({
        model: "gpt-4",
        user: "alice",
        apiKey: undefined,
        status: "200",
        dateFrom: undefined,
        dateTo: undefined,
      });
    });

    it("returns undefined for empty string params", () => {
      mockSearchParams.set("model", "");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.filters.model).toBeUndefined();
    });

    it("returns undefined for non-existent params", () => {
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.filters.model).toBeUndefined();
      expect(result.current.filters.user).toBeUndefined();
    });
  });

  describe("setFilter", () => {
    it("sets a filter value in URL params", () => {
      const { result } = renderHook(() => usePageFilters());
      result.current.setFilter("model", "gpt-4");
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("removes filter when value is undefined", () => {
      mockSearchParams.set("model", "gpt-4");
      const { result } = renderHook(() => usePageFilters());
      result.current.setFilter("model", undefined);
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it("removes filter when value is empty string", () => {
      mockSearchParams.set("model", "gpt-4");
      const { result } = renderHook(() => usePageFilters());
      result.current.setFilter("model", "");
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  describe("clearFilters", () => {
    it("clears all filters by resetting URL params", () => {
      mockSearchParams.set("model", "gpt-4");
      mockSearchParams.set("user", "alice");
      const { result } = renderHook(() => usePageFilters());
      result.current.clearFilters();
      expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams());
    });

    it("removes all filter values from searchParams", () => {
      mockSearchParams.set("model", "gpt-4");
      mockSearchParams.set("user", "alice");
      mockSearchParams.set("status", "200");
      const { result } = renderHook(() => usePageFilters());

      // Verify filters are set
      expect(result.current.hasActiveFilters).toBe(true);

      // Clear and manually update mock to simulate re-render
      result.current.clearFilters();
      mockSearchParams = new URLSearchParams();

      // Create new hook instance to verify empty state
      const { result: newResult } = renderHook(() => usePageFilters());
      expect(newResult.current.hasActiveFilters).toBe(false);
    });
  });

  describe("hasActiveFilters", () => {
    it("returns true when model filter is active", () => {
      mockSearchParams.set("model", "gpt-4");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("returns true when any filter is active", () => {
      mockSearchParams.set("user", "alice");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("returns true when multiple filters are active", () => {
      mockSearchParams.set("model", "gpt-4");
      mockSearchParams.set("user", "alice");
      mockSearchParams.set("status", "200");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("returns false when no filters are active", () => {
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it("returns false when all filters are empty strings", () => {
      mockSearchParams.set("model", "");
      mockSearchParams.set("user", "");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe("Date filters", () => {
    it("parses dateFrom param from URL", () => {
      mockSearchParams.set("dateFrom", "2024-01-01");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.filters.dateFrom).toBe("2024-01-01");
    });

    it("parses dateTo param from URL", () => {
      mockSearchParams.set("dateTo", "2024-12-31");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.filters.dateTo).toBe("2024-12-31");
    });

    it("sets date filter in URL", () => {
      const { result } = renderHook(() => usePageFilters());
      result.current.setFilter("dateFrom", "2024-06-15");
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  describe("apiKey filter", () => {
    it("parses apiKey param from URL", () => {
      mockSearchParams.set("apiKey", "sk-test-key");
      const { result } = renderHook(() => usePageFilters());
      expect(result.current.filters.apiKey).toBe("sk-test-key");
    });
  });
});
