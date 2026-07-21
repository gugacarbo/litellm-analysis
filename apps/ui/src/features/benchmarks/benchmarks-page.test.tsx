/** @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BenchmarkListInput } from "./contracts/benchmarks";

const navigate = vi.fn();
const requests = vi.hoisted(() => ({ aa: vi.fn(), openrouter: vi.fn() }));
const mutations = vi.hoisted(() => ({ syncBenchmarks: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
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
  syncBenchmarks: mutations.syncBenchmarks,
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

function renderQueryError(
  role: "admin" | "viewer",
  code: "SNAPSHOT_NOT_FOUND" | "UPSTREAM_UNAVAILABLE",
  message = "Public benchmark error",
) {
  requests.aa.mockRejectedValue(Object.assign(new Error(message), { code }));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <BenchmarksPage role={role} search={search} source="aa" />
    </QueryClientProvider>,
  );
}

const renderMissingSnapshot = (role: "admin" | "viewer") =>
  renderQueryError(role, "SNAPSHOT_NOT_FOUND");

afterEach(() => {
  cleanup();
  navigate.mockClear();
  requests.aa.mockReset();
  requests.openrouter.mockReset();
  mutations.syncBenchmarks.mockReset();
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

  it("shows a non-destructive unconfigured catalog state to viewers", async () => {
    renderMissingSnapshot("viewer");

    expect(
      await screen.findByText("Catálogo ainda não sincronizado"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Este catálogo ainda não está disponível. Peça a um administrador para sincronizá-lo.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Sincronizar catálogo" }),
    ).toBeNull();
    expect(
      screen.queryByText("Não foi possível carregar benchmarks"),
    ).toBeNull();
  });

  it("gives administrators a sync CTA when the snapshot is missing", async () => {
    renderMissingSnapshot("admin");

    expect(
      await screen.findByRole("button", { name: "Sincronizar catálogo" }),
    ).toBeTruthy();
  });

  it("keeps generic upstream failures destructive and retryable", async () => {
    renderQueryError(
      "viewer",
      "UPSTREAM_UNAVAILABLE",
      "Bearer read-secret-should-not-render",
    );

    expect(
      await screen.findByText("Não foi possível carregar benchmarks"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Não foi possível consultar este catálogo. Tente novamente.",
      ),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain(
      "read-secret-should-not-render",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(requests.aa).toHaveBeenCalledTimes(2);
  });

  it("maps a missing sync credential to a public configuration CTA", async () => {
    mutations.syncBenchmarks.mockResolvedValue({
      ok: false,
      error: {
        code: "CREDENTIAL_NOT_CONFIGURED",
        message: "internal credential diagnostic",
        retryable: false,
      },
    });
    renderPage("admin");

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar" }));

    expect(
      await screen.findByText("Credencial do catálogo não configurada"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Configurar credencial" })
        .getAttribute("href"),
    ).toBe("/secrets");
    expect(document.body.textContent).not.toContain(
      "internal credential diagnostic",
    );
  });

  it("redacts arbitrary generic synchronization errors", async () => {
    mutations.syncBenchmarks.mockResolvedValue({
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: "Bearer sync-secret-should-not-render",
        retryable: true,
      },
    });
    renderPage("admin");

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar" }));

    expect(await screen.findByText("Falha ao sincronizar")).toBeTruthy();
    expect(
      screen.getByText(
        "Não foi possível sincronizar o catálogo. Tente novamente.",
      ),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain(
      "sync-secret-should-not-render",
    );
  });
});
