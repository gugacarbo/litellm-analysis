/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../features/ui-preferences/server/ui-preferences.functions", () => ({
  getUiPreferences: vi.fn(),
}));

import { getUiPreferences } from "../features/ui-preferences/server/ui-preferences.functions";
import { PREPAINT_THEME_SCRIPT, Route } from "./__root";

const rootRouteOptions = Route.options as unknown as {
  head: () => { meta: Array<{ title?: string }> };
  loader: () => Promise<{ theme: "light" | "dark"; sidebar: string }>;
};

describe("root document theme contract", () => {
  beforeEach(() => {
    vi.mocked(getUiPreferences).mockResolvedValue({
      theme: "dark",
      sidebar: "collapsed",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // biome-ignore lint/suspicious/noDocumentCookie: The pre-paint contract reads ui_theme directly from document.cookie.
    document.cookie = "ui_theme=; Max-Age=0; Path=/";
    document.documentElement.className = "";
  });

  it("loads the SSR preference and identifies the product document", async () => {
    expect(await rootRouteOptions.loader()).toEqual({
      theme: "dark",
      sidebar: "collapsed",
    });

    expect(rootRouteOptions.head().meta).toContainEqual({
      title: "AgentLens",
    });
  });

  it.each([
    ["dark", true],
    ["light", false],
  ] as const)("resolves a missing theme before paint for a %s system preference", (expectedTheme, prefersDark) => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: prefersDark }),
    );

    new Function(PREPAINT_THEME_SCRIPT)();

    expect(document.documentElement.classList.contains(expectedTheme)).toBe(
      true,
    );
    expect(document.cookie).toContain(`ui_theme=${expectedTheme}`);
  });

  it("replaces an invalid theme cookie without touching other cookies", () => {
    // biome-ignore lint/suspicious/noDocumentCookie: The pre-paint contract reads ui_theme directly from document.cookie.
    document.cookie = "ui_theme=blue; Path=/";
    // biome-ignore lint/suspicious/noDocumentCookie: The pre-paint contract must leave unrelated cookies untouched.
    document.cookie = "ui_sidebar=collapsed; Path=/";
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    new Function(PREPAINT_THEME_SCRIPT)();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.cookie).toContain("ui_theme=dark");
    expect(document.cookie).toContain("ui_sidebar=collapsed");
  });

  it("normalizes a malformed encoded theme cookie without throwing", () => {
    // biome-ignore lint/suspicious/noDocumentCookie: The pre-paint contract reads ui_theme directly from document.cookie.
    document.cookie = "ui_theme=%E0%A4; Path=/";
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));

    expect(() => new Function(PREPAINT_THEME_SCRIPT)()).not.toThrow();
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.cookie).toContain("ui_theme=light");
  });
});
