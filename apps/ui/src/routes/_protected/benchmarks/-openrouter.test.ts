import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/benchmarks/query/query-options", () => ({
  benchmarkQueries: {
    openrouter: vi.fn((input) => ({
      queryKey: ["benchmarks", "openrouter", input],
    })),
  },
}));

import { benchmarkListInputSchema } from "@/features/benchmarks/contracts/benchmarks";
import { benchmarkQueries } from "@/features/benchmarks/query/query-options";
import { Route } from "./openrouter";

afterEach(() => vi.clearAllMocks());

describe("/benchmarks/openrouter route", () => {
  it("preloads only the OpenRouter snapshot query", async () => {
    expect(Route.options.validateSearch).toBe(benchmarkListInputSchema);
    const search = {
      page: 1,
      pageSize: 25,
      subsource: "design-arena",
      sort: "elo",
    };
    const ensureQueryData = vi.fn().mockResolvedValue(undefined);
    const loader = Route.options.loader;
    if (typeof loader !== "function") {
      throw new Error("OpenRouter loader is required");
    }

    await loader({
      context: { queryClient: { ensureQueryData } },
      deps: search,
    } as never);

    expect(benchmarkQueries.openrouter).toHaveBeenCalledWith(search);
    expect(ensureQueryData).toHaveBeenCalledWith({
      queryKey: ["benchmarks", "openrouter", search],
    });
  });
});
