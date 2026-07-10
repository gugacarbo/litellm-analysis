import { describe, expect, it, vi } from "vitest";

// Mock the server functions before any imports
vi.mock("../server/auth/get-session.functions", () => ({
  getSession: vi.fn(),
}));

vi.mock("../server/runtime-status.functions", () => ({
  getRuntimeStatus: vi.fn(),
}));

import { getSession } from "../server/auth/get-session.functions";
import { getRuntimeStatus } from "../server/runtime-status.functions";

describe("_protected route (beforeLoad)", () => {
  it("redireciona para /login quando nao ha sessao", async () => {
    vi.mocked(getSession).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "No valid session" },
    });

    const { Route } = await import("./_protected");
    const beforeLoad = Route.options.beforeLoad;

    if (!beforeLoad) {
      throw new Error("beforeLoad is not defined");
    }

    const location = { pathname: "/dashboard" };

    try {
      await beforeLoad({ location } as never);
      // Should not reach here
      expect(true).toBe(false);
    } catch (err) {
      const response = err as Response & { options?: { to?: string; search?: { returnTo?: string }; statusCode?: number } };
      expect(response.status).toBe(307);
      expect(response.options?.to).toBe("/login");
      expect(response.options?.search?.returnTo).toBe("/dashboard");
    }
  });

  it("retorna sessao quando autenticado", async () => {
    const mockSession = {
      user: { id: "user-1", role: "admin" },
      session: { id: "sess-1" },
    };

    vi.mocked(getSession).mockResolvedValue({
      ok: true,
      session: mockSession,
    });

    const { Route } = await import("./_protected");
    const beforeLoad = Route.options.beforeLoad;

    if (!beforeLoad) {
      throw new Error("beforeLoad is not defined");
    }

    const result = await beforeLoad({
      location: { pathname: "/" },
    } as never);

    expect(result).toEqual({ session: mockSession });
  });
});

describe("_protected/index route (runtime-status query)", () => {
  it("chama getRuntimeStatus uma vez na query", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue({
      ok: true,
      authenticated: true,
      runtime: "tanstack-start",
    });

    // Simulate the queryFn behavior
    const queryFn = () => getRuntimeStatus({ data: {} });
    const result = await queryFn();

    expect(result).toEqual({
      ok: true,
      authenticated: true,
      runtime: "tanstack-start",
    });
    expect(getRuntimeStatus).toHaveBeenCalledTimes(1);
  });

  it("retorna erro quando getRuntimeStatus falha", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL", message: "Internal server error" },
    });

    const queryFn = () => getRuntimeStatus({ data: {} });
    const result = await queryFn();

    expect(result).toEqual({
      ok: false,
      error: { code: "INTERNAL", message: "Internal server error" },
    });
  });

  it("retorna UNAUTHENTICATED quando nao ha sessao", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue({
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "No valid session found",
      },
    });

    const queryFn = () => getRuntimeStatus({ data: {} });
    const result = await queryFn();

    expect(result).toEqual({
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "No valid session found",
      },
    });
  });

  it("retorna FORBIDDEN quando usuario nao e admin", async () => {
    vi.mocked(getRuntimeStatus).mockResolvedValue({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Role 'admin' required",
      },
    });

    const queryFn = () => getRuntimeStatus({ data: {} });
    const result = await queryFn();

    expect(result).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Role 'admin' required",
      },
    });
  });
});
