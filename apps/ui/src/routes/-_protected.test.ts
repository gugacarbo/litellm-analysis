/** @vitest-environment jsdom */

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the server functions before any imports
vi.mock(
  "@/features/auth/server/get-session.functions",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/auth/server/get-session.functions")
    >()),
    getSession: vi.fn(),
  }),
);

vi.mock("@/features/ui-preferences/server/ui-preferences.functions", () => ({
  getUiPreferences: vi.fn(),
  setSidebarPreference: vi.fn(),
  setThemePreference: vi.fn(),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: { signOut: vi.fn() },
}));

vi.mock("@/styles.css?url", () => ({ default: "/styles.css" }));

vi.mock("@tanstack/react-devtools", () => ({
  TanStackDevtools: () => null,
}));

vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtoolsPanel: () => null,
}));

import {
  getSession,
  projectPublicSession,
} from "@/features/auth/server/get-session.functions";
import { getUiPreferences } from "@/features/ui-preferences/server/ui-preferences.functions";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("_protected route (beforeLoad)", () => {
  const preferences = { theme: "dark" as const, sidebar: "collapsed" as const };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("scrollTo", vi.fn());
    vi.mocked(getUiPreferences).mockResolvedValue(preferences);
  });

  it("redireciona para /login quando nao ha sessao", async () => {
    vi.mocked(getSession).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "No valid session" },
    });

    const { Route } = await import("@/routes/_protected");
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
      const response = err as Response & {
        options?: {
          to?: string;
          search?: { returnTo?: string };
          statusCode?: number;
        };
      };
      expect(response.status).toBe(307);
      expect(response.options?.to).toBe("/login");
      expect(response.options?.search?.returnTo).toBe("/dashboard");
    }
  });

  it("retorna sessao quando autenticado", async () => {
    const mockSession = {
      user: {
        id: "user-1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        role: "admin" as const,
      },
    };

    vi.mocked(getSession).mockResolvedValue({
      ok: true,
      session: mockSession,
    });

    const { Route } = await import("@/routes/_protected");
    const beforeLoad = Route.options.beforeLoad;

    if (!beforeLoad) {
      throw new Error("beforeLoad is not defined");
    }

    const result = await beforeLoad({
      location: { pathname: "/" },
    } as never);

    expect(result).toEqual({ preferences, session: mockSession });
  });

  it("mounts the authenticated account menu through the AppShell slot", async () => {
    const { Route } = await import("@/routes/_protected");
    vi.mocked(getSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
          role: "admin",
        },
      },
    });
    const rootRoute = createRootRoute({
      loader: () => getUiPreferences({ data: {} }),
      component: () => createElement(Outlet),
    });
    const protectedRoute = createRoute({
      getParentRoute: () => rootRoute,
      id: "/_protected",
      component: Route.options.component,
      beforeLoad: Route.options.beforeLoad,
    });
    const indexRoute = createRoute({
      getParentRoute: () => protectedRoute,
      path: "/",
      component: () => createElement("main", null, "Dashboard"),
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([
        protectedRoute.addChildren([indexRoute]),
      ]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });

    render(createElement(RouterProvider, { router }));

    const accountMenu = await screen.findByRole("region", {
      name: "Account menu",
    });
    expect(accountMenu.textContent).toContain("Ada Lovelace");
    expect(accountMenu.textContent).toContain("ada@example.com");
    expect(accountMenu.textContent).toContain("admin");
    expect(getSession).toHaveBeenCalledTimes(1);
  });
});

describe("public shell session projection", () => {
  it("exposes only the public fields required by the account menu", () => {
    expect(
      projectPublicSession(
        { user: { id: "user-1", role: "admin" } },
        { name: "Ada Lovelace", email: "ada@example.com" },
      ),
    ).toEqual({
      user: {
        id: "user-1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        role: "admin",
      },
    });
  });
});
