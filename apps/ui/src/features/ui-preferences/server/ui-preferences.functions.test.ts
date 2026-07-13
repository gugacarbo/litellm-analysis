import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/server/invites", () => ({
  requireSession: vi.fn(),
}));

import type { Auth } from "@/features/auth/server/auth";
import { requireSession } from "@/features/auth/server/invites";
import {
  getUiPreferencesFromCookie,
  handleSetSidebarPreference,
  handleSetThemePreference,
  serializePreferenceCookie,
} from "@/features/ui-preferences/server/ui-preferences.functions";

function mockAuth(): Auth {
  return {
    handler: vi.fn(),
    db: {} as Auth["db"],
    options: { secret: "test" },
  };
}

function mockRequest(cookie?: string): Request {
  return new Request("http://localhost", {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("getUiPreferencesFromCookie", () => {
  it("uses safe fallbacks when preference cookies are absent or corrupted", () => {
    expect(getUiPreferencesFromCookie(null)).toEqual({
      theme: "light",
      sidebar: "expanded",
    });
    expect(
      getUiPreferencesFromCookie("ui_theme=blue; ui_sidebar=hidden"),
    ).toEqual({ theme: "light", sidebar: "expanded" });
  });

  it("returns only canonical cookie values", () => {
    expect(
      getUiPreferencesFromCookie("ui_sidebar=collapsed; ui_theme=dark"),
    ).toEqual({ theme: "dark", sidebar: "collapsed" });
  });
});

describe("serializePreferenceCookie", () => {
  it("serializes a preference for 180 days without HttpOnly outside production", () => {
    expect(
      serializePreferenceCookie("ui_theme", "dark", { isProduction: false }),
    ).toBe("ui_theme=dark; Path=/; SameSite=Lax; Max-Age=15552000");
  });

  it("adds Secure only in production", () => {
    expect(
      serializePreferenceCookie("ui_sidebar", "collapsed", {
        isProduction: true,
      }),
    ).toBe(
      "ui_sidebar=collapsed; Path=/; SameSite=Lax; Max-Age=15552000; Secure",
    );
  });
});

describe("preference mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHENTICATED and emits no cookie when a theme mutation has no session", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "No valid session" },
    });
    const setCookie = vi.fn();

    const result = await handleSetThemePreference({
      auth: mockAuth(),
      request: mockRequest(),
      theme: "dark",
      setCookie,
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "No valid session" },
    });
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("returns the accepted sidebar value and renews its cookie for a valid session", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      ok: true,
      session: {
        user: { id: "user-1", role: "viewer" },
        session: { id: "session-1" },
      },
    });
    const setCookie = vi.fn();

    const result = await handleSetSidebarPreference({
      auth: mockAuth(),
      request: mockRequest(),
      sidebar: "collapsed",
      setCookie,
      isProduction: false,
    });

    expect(result).toEqual({ ok: true, sidebar: "collapsed" });
    expect(setCookie).toHaveBeenCalledWith(
      "ui_sidebar=collapsed; Path=/; SameSite=Lax; Max-Age=15552000",
    );
  });
});
