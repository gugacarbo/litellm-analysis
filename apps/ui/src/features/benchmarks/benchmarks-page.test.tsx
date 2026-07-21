/** @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BenchmarkListInput } from "./contracts/benchmarks";

const navigate = vi.fn();
const requests = vi.hoisted(() => ({ aa: vi.fn(), openrouter: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => (
    <a href="#benchmarks">{children}</a>
  ),
  useNavigate: () => navigate,
}));

vi.mock("./query/query-options", () => ({
  benchmarkQueries: {
    aa: (input: unknown) => ({
      queryKey: ["benchmarks", "aa", input],
      queryFn: () => requests.aa(input),
    }),
    openrouter: (input: unknown) => ({
      queryKey: ["benchmarks", "openrouter", input],
      queryFn: () => requests.openrouter(input),
    }),
  },
}));

vi.mock("./server/benchmarks.functions", () => ({
  syncBenchmarks: vi.fn(),
}));

import { BenchmarksPage } from "./benchmarks-page";

const search: BenchmarkListInput = {
  page: 1,
  pageSize: 25,
  search: "",
  provider: "",
  sort: "intelligence",
  sortDirection: "desc",
  arena: "",
  category: "",
};

const metadata = {
  catalog: "openrouter" as const,
  fetchedAt: "2026-07-21T12:00:00.000Z",
  count: 2,
  attribution: {
    label: "OpenRouter Benchmarks",
    url: "https://openrouter.ai/api/v1/benchmarks",
    citation: null,
  },
};

function renderPage(role: "admin" | "viewer") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  client.setQueryData(["benchmarks", "openrouter", search], {
    metadata,
    items: [
      {
        id: "aa:model",
        subsource: "artificial-analysis",
        modelPermaslug: "openai/model",
        name: "AA Model",
        provider: "openai",
        arena: null,
        category: null,
        elo: null,
        winRate: null,
        averageTimeSeconds: null,
        intelligenceIndex: 50,
        priceInput1mTokens: 1,
        priceOutput1mTokens: 2,
        attribution: metadata.attribution,
        native: {},
      },
      {
        id: "arena:model",
        subsource: "design-arena",
        modelPermaslug: "anthropic/model",
        name: "Arena Model",
        provider: "anthropic",
        arena: "chatbot",
        category: "coding",
        elo: 1200,
        winRate: 55,
        averageTimeSeconds: 2,
        intelligenceIndex: null,
        priceInput1mTokens: null,
        priceOutput1mTokens: null,
        attribution: metadata.attribution,
        native: {},
      },
    ],
    page: 1,
    pageSize: 25,
    total: 2,
    pageCount: 1,
  });
  return render(
    <QueryClientProvider client={client}>
      <BenchmarksPage role={role} search={search} source="openrouter" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  navigate.mockClear();
});

describe("BenchmarksPage", () => {
  it("keeps Artificial Analysis and Design Arena in distinct sections for a viewer", () => {
    renderPage("viewer");

    expect(screen.getByText("Artificial Analysis via OpenRouter")).toBeTruthy();
    expect(screen.getAllByText("Design Arena")).toHaveLength(2);
    expect(screen.getByText("AA Model")).toBeTruthy();
    expect(screen.getByText("Arena Model")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sincronizar" })).toBeNull();
  });

  it("shows synchronization only to administrators", () => {
    renderPage("admin");

    expect(screen.getByRole("button", { name: "Sincronizar" })).toBeTruthy();
  });
});
