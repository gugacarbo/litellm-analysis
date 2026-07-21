import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/benchmarks/query/query-options", () => ({
  benchmarkQueries: {
    aa: vi.fn((input) => ({ queryKey: ["benchmarks", "aa", input] })),
  },
}));

import { benchmarkListInputSchema } from "@/features/benchmarks/contracts/benchmarks";
import { benchmarkQueries } from "@/features/benchmarks/query/query-options";
import { Route } from "./aa";

afterEach(() => vi.clearAllMocks());

describe("/benchmarks/aa route", () => {
  it("validates search and preloads the authenticated snapshot query", async () => {
    expect(Route.options.validateSearch).toBe(benchmarkListInputSchema);
    const search = { page: 2, pageSize: 10, search: "gpt" };
    expect(Route.options.loaderDeps?.({ search } as never)).toBe(search);

    const ensureQueryData = vi.fn().mockResolvedValue(undefined);
    const loader = Route.options.loader;
    if (typeof loader !== "function") throw new Error("AA loader is required");

    await loader({
      context: { queryClient: { ensureQueryData } },
      deps: search,
    } as never);

    expect(benchmarkQueries.aa).toHaveBeenCalledWith(search);
    expect(ensureQueryData).toHaveBeenCalledWith({
      queryKey: ["benchmarks", "aa", search],
    });
  });
});
