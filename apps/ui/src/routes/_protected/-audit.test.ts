import { Outlet } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/audit/query/query-options", () => ({
  auditQueries: { list: vi.fn((input) => ({ queryKey: ["audit", input] })) },
}));

import { auditQueries } from "@/features/audit/query/query-options";
import { Route } from "./audit";

describe("audit protected route", () => {
  it("terminates at the read-only audit page", () => {
    expect(Route.options.component).not.toBe(Outlet);
    expect(Route.options.component?.name).toBe("Lazy");
  });

  it("redirects viewers before loader prefetch", async () => {
    const beforeLoad = Route.options.beforeLoad;
    const loader = Route.options.loader;
    if (typeof beforeLoad !== "function" || typeof loader !== "function") {
      throw new Error("Audit route hooks are required");
    }
    const queryClient = { ensureQueryData: vi.fn() };

    try {
      await beforeLoad({
        context: { session: { user: { role: "viewer" } } },
      } as never);
      throw new Error("Viewer route should redirect");
    } catch (cause) {
      expect(cause).toMatchObject({ status: 307 });
    }
    expect(queryClient.ensureQueryData).not.toHaveBeenCalled();
  });

  it("prefetches the normalized admin search input", async () => {
    const loader = Route.options.loader;
    if (typeof loader !== "function") {
      throw new Error("Audit route loader is required");
    }
    const queryClient = {
      ensureQueryData: vi.fn().mockResolvedValue(undefined),
    };
    const search = { action: "model.updated", pageSize: 50 };

    await loader({ context: { queryClient }, deps: search } as never);

    expect(auditQueries.list).toHaveBeenCalledWith(search);
    expect(queryClient.ensureQueryData).toHaveBeenCalledTimes(1);
  });
});
