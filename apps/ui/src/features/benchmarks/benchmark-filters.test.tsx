/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BenchmarkListInput } from "./contracts/benchmarks";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

import { BenchmarkFilters, BenchmarkPagination } from "./benchmark-filters";

const baseSearch: BenchmarkListInput = {
  page: 3,
  pageSize: 25,
  search: "old query",
  provider: "Anthropic",
  sort: "price",
  sortDirection: "asc",
  arena: "arena-to-preserve",
  category: "category-to-preserve",
};

afterEach(() => {
  cleanup();
  navigate.mockClear();
});

describe("BenchmarkFilters", () => {
  it("submits AA filters at page one while preserving the applicable sort state", () => {
    render(<BenchmarkFilters search={baseSearch} source="aa" />);

    fireEvent.change(screen.getByLabelText("Buscar benchmarks"), {
      target: { value: "new query" },
    });
    fireEvent.change(screen.getByLabelText("Inteligência mínima"), {
      target: { value: "42" },
    });
    fireEvent.change(screen.getByLabelText("Preço máximo"), {
      target: { value: "3.5" },
    });
    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "name" },
    });
    const form = screen
      .getByRole("button", { name: "Aplicar filtros" })
      .closest("form");
    if (!form) throw new Error("Benchmark filters must be inside a form");
    fireEvent.submit(form);

    expect(navigate).toHaveBeenCalledWith({
      to: "/benchmarks/aa",
      search: expect.objectContaining({
        page: 1,
        pageSize: 25,
        search: "new query",
        provider: "Anthropic",
        minIntelligence: 42,
        maxPrice: 3.5,
        sort: "name",
        sortDirection: "asc",
        arena: "arena-to-preserve",
        category: "category-to-preserve",
      }),
    });
  });

  it("submits OpenRouter filters at page one with its native sort and source filters", () => {
    const search: BenchmarkListInput = {
      ...baseSearch,
      page: 4,
      sort: "elo",
      sortDirection: "desc",
      subsource: "design-arena",
      arena: "chatbot",
      category: "general",
    };
    render(<BenchmarkFilters search={search} source="openrouter" />);

    fireEvent.change(screen.getByLabelText("Categoria"), {
      target: { value: "coding" },
    });
    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "winRate" },
    });
    fireEvent.change(screen.getByLabelText("Direção"), {
      target: { value: "asc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(navigate).toHaveBeenCalledWith({
      to: "/benchmarks/openrouter",
      search: expect.objectContaining({
        page: 1,
        pageSize: 25,
        search: "old query",
        provider: "Anthropic",
        subsource: "design-arena",
        arena: "chatbot",
        category: "coding",
        sort: "winRate",
        sortDirection: "asc",
      }),
    });
  });
});

describe("BenchmarkPagination", () => {
  it("navigates to previous and next pages without dropping filters or sort", () => {
    const search: BenchmarkListInput = {
      ...baseSearch,
      page: 2,
      sort: "elo",
      sortDirection: "desc",
      subsource: "design-arena",
    };
    render(
      <BenchmarkPagination
        page={2}
        pageCount={3}
        search={search}
        source="openrouter"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(navigate).toHaveBeenNthCalledWith(1, {
      to: "/benchmarks/openrouter",
      search: { ...search, page: 1 },
    });
    expect(navigate).toHaveBeenNthCalledWith(2, {
      to: "/benchmarks/openrouter",
      search: { ...search, page: 3 },
    });
  });
});
