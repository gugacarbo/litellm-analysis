import { describe, expect, it, vi } from "vitest";
import {
  type BenchmarkHandlerDeps,
  handleListArtificialAnalysis,
  handleSyncBenchmarks,
} from "./benchmarks.handlers";

const input = {
  page: 1,
  pageSize: 25,
  search: "",
  provider: "",
  sort: "intelligence" as const,
  sortDirection: "desc" as const,
  arena: "",
  category: "",
};

function deps(role: "admin" | "viewer" = "admin"): BenchmarkHandlerDeps {
  return {
    getSession: vi.fn().mockResolvedValue({
      ok: true,
      session: { user: { id: "u", role }, session: { id: "s" } },
    }),
    requireAdmin: vi.fn().mockResolvedValue(
      role === "admin"
        ? { ok: true }
        : {
            ok: false,
            error: { code: "FORBIDDEN", message: "Admin required" },
          },
    ),
    getService: vi.fn().mockResolvedValue({
      listArtificialAnalysis: vi.fn().mockResolvedValue({
        items: [],
        metadata: {},
        page: 1,
        pageSize: 25,
        total: 0,
        pageCount: 1,
      }),
      listOpenRouter: vi.fn(),
      sync: vi
        .fn()
        .mockResolvedValue({ count: 1, fetchedAt: "2026-01-01T00:00:00.000Z" }),
    }),
  };
}

describe("benchmark handlers", () => {
  it("allows authenticated viewers to read", async () => {
    const testDeps = deps("viewer");
    await expect(
      handleListArtificialAnalysis(testDeps, input),
    ).resolves.toMatchObject({ ok: true });
    expect(testDeps.getService).toHaveBeenCalledOnce();
  });

  it("rejects viewer sync before resolving the service or secret", async () => {
    const testDeps = deps("viewer");
    await expect(
      handleSyncBenchmarks(testDeps, "openrouter"),
    ).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(testDeps.getService).not.toHaveBeenCalled();
  });

  it("requires a session for reads", async () => {
    const testDeps = deps();
    testDeps.getSession = vi.fn().mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "No session" },
    });
    await expect(
      handleListArtificialAnalysis(testDeps, input),
    ).resolves.toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
    expect(testDeps.getService).not.toHaveBeenCalled();
  });
});
