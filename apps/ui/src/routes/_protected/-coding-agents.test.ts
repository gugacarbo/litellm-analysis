import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/coding-agents/coding-agents-page", () => ({
  CodingAgentsPage: vi.fn(() => null),
}));
vi.mock("@/features/coding-agents/query/query-options", () => ({
  codingAgentsOverviewQuery: vi.fn(() => ({ queryKey: ["coding-agents"] })),
}));

import { CodingAgentsPage } from "@/features/coding-agents/coding-agents-page";
import { Route } from "./coding-agents";

describe("coding agents protected route", () => {
  it("redirects viewers before loading configuration", async () => {
    const beforeLoad = Route.options.beforeLoad;
    if (typeof beforeLoad !== "function")
      throw new Error("beforeLoad is required");
    try {
      await beforeLoad({
        context: { session: { user: { role: "viewer" } } },
      } as never);
      throw new Error("Viewer route should redirect");
    } catch (cause) {
      expect(cause).toMatchObject({ status: 307 });
    }
  });

  it("renders the page and prefetches for administrators", async () => {
    expect(Route.options.component?.name).toBe("Lazy");
    const component = Route.options.component as typeof CodingAgentsPage & {
      preload?: () => Promise<void>;
    };
    await component.preload?.();
    expect(component().type).toBe(CodingAgentsPage);
    const ensureQueryData = vi.fn().mockResolvedValue(undefined);
    const loader = Route.options.loader;
    if (typeof loader !== "function") throw new Error("loader is required");
    await loader({ context: { queryClient: { ensureQueryData } } } as never);
    expect(ensureQueryData).toHaveBeenCalledWith({
      queryKey: ["coding-agents"],
    });
  });
});
