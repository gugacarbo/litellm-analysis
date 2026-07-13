/** @vitest-environment node */

import {
  createMemoryHistory,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/ui-preferences/server/ui-preferences.functions", () => ({
  getUiPreferences: vi.fn(),
}));

vi.mock("@/styles.css?url", () => ({
  default: "/styles.css",
}));

import { getUiPreferences } from "@/features/ui-preferences/server/ui-preferences.functions";
import { Route } from "@/routes/__root";

describe("root document SSR", () => {
  beforeEach(() => {
    vi.mocked(getUiPreferences).mockResolvedValue({
      theme: "dark",
      sidebar: "collapsed",
    });
  });

  it("emits the loader theme on the SSR html element", async () => {
    const indexRoute = createRoute({
      getParentRoute: () => Route,
      path: "/",
      component: () => <main>SSR content</main>,
    });
    const router = createRouter({
      routeTree: Route.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });

    await router.load();
    const html = renderToStaticMarkup(<RouterProvider router={router} />);

    expect(html).toContain('<html class="dark" lang="en">');
    expect(html).toContain("SSR content");
  });
});
