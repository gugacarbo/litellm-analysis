import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const noop = vi.fn();

vi.mock("./hooks/use-benchmarks-page", () => ({
  useBenchmarksPage: () => ({
    providers: [], rows: [], isLoading: false, error: null,
    isDatasetMissing: false, syncStatusLabel: "Idle", syncCooldownLabel: null,
    syncLastError: null, isSyncRunning: false, source: "Artificial Analysis",
    sourceUrl: "https://example.test", fetchedAt: null, selectedIds: [],
    activeUseCase: "balanced", sortedByUseCase: [], search: "", provider: "all",
    showConfiguredOnly: false, minIntelligence: "", maxBlendedPrice: "",
    sortField: "intelligence", sortDirection: "desc",
    pagination: { total: 0, page: 1, pageSize: 20 }, page: 1, pageSize: 20,
    toggleModel: noop, clearAll: noop, setUseCase: noop, compareTop3: noop,
    setSearch: noop, setProvider: noop, setShowConfiguredOnly: noop,
    setMinIntelligence: noop, setMaxBlendedPrice: noop, setSortField: noop,
    setSortDirection: noop, goToPage: noop, changePageSize: noop, applyFilters: noop,
  }),
}));

import { BenchmarksPage } from "./index";

describe("BenchmarksPage", () => {
  it("is read-only and hands benchmark sync and aliases to apps/ui", () => {
    render(<BenchmarksPage />);

    expect(screen.getAllByText(/deprecated surface is read-only/i)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /sync benchmarks|aliases/i })).toBeNull();
  });
});
