import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Auth } from "../../auth/server/auth";

export const UI_THEME_COOKIE = "ui_theme";
export const UI_SIDEBAR_COOKIE = "ui_sidebar";
export const UI_PREFERENCE_MAX_AGE_SECONDS = 15552000;

export type ThemePreference = "light" | "dark";
export type SidebarPreference = "expanded" | "collapsed";

export type UiPreferences = {
  theme: ThemePreference;
  sidebar: SidebarPreference;
};

type CookieName = typeof UI_THEME_COOKIE | typeof UI_SIDEBAR_COOKIE;
type CookieValue = ThemePreference | SidebarPreference;

type PreferenceMutationError = {
  ok: false;
  error: {
    code: "UNAUTHENTICATED";
    message: string;
  };
};

type PreferenceMutationDeps = {
  auth: Auth;
  request: Request;
  setCookie: (cookie: string) => void;
  isProduction?: boolean;
};

export type SetThemePreferenceDeps = PreferenceMutationDeps & {
  theme: ThemePreference;
};

export type SetSidebarPreferenceDeps = PreferenceMutationDeps & {
  sidebar: SidebarPreference;
};

export type SetThemePreferenceResult =
  | { ok: true; theme: ThemePreference }
  | PreferenceMutationError;

export type SetSidebarPreferenceResult =
  | { ok: true; sidebar: SidebarPreference }
  | PreferenceMutationError;

function getCookieValue(cookieHeader: string | null, name: CookieName) {
  if (!cookieHeader) return undefined;

  for (const cookie of cookieHeader.split(";")) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex === -1) continue;

    const cookieName = cookie.slice(0, separatorIndex).trim();
    if (cookieName === name) {
      return cookie.slice(separatorIndex + 1);
    }
  }

  return undefined;
}

function parseThemePreference(
  value: string | undefined,
): ThemePreference | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}

function parseSidebarPreference(
  value: string | undefined,
): SidebarPreference | undefined {
  return value === "expanded" || value === "collapsed" ? value : undefined;
}

export function getUiPreferencesFromCookie(
  cookieHeader: string | null,
): UiPreferences {
  return {
    theme:
      parseThemePreference(getCookieValue(cookieHeader, UI_THEME_COOKIE)) ??
      "light",
    sidebar:
      parseSidebarPreference(getCookieValue(cookieHeader, UI_SIDEBAR_COOKIE)) ??
      "expanded",
  };
}

export function serializePreferenceCookie(
  name: CookieName,
  value: CookieValue,
  { isProduction = import.meta.env.PROD }: { isProduction?: boolean } = {},
): string {
  const attributes = [
    `${name}=${value}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${UI_PREFERENCE_MAX_AGE_SECONDS}`,
  ];

  if (isProduction) attributes.push("Secure");

  return attributes.join("; ");
}

async function handleSetPreference(
  deps: PreferenceMutationDeps,
  name: CookieName,
  value: CookieValue,
): Promise<PreferenceMutationError | { ok: true }> {
  const { requireSession } = await import("../../auth/server/invites");
  const sessionResult = await requireSession({
    auth: deps.auth,
    request: deps.request,
  });

  if (!sessionResult.ok) {
    return {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: sessionResult.error.message,
      },
    };
  }

  deps.setCookie(
    serializePreferenceCookie(name, value, {
      isProduction: deps.isProduction,
    }),
  );
  return { ok: true };
}

export async function handleSetThemePreference(
  deps: SetThemePreferenceDeps,
): Promise<SetThemePreferenceResult> {
  const result = await handleSetPreference(deps, UI_THEME_COOKIE, deps.theme);
  return result.ok ? { ok: true, theme: deps.theme } : result;
}

export async function handleSetSidebarPreference(
  deps: SetSidebarPreferenceDeps,
): Promise<SetSidebarPreferenceResult> {
  const result = await handleSetPreference(
    deps,
    UI_SIDEBAR_COOKIE,
    deps.sidebar,
  );
  return result.ok ? { ok: true, sidebar: deps.sidebar } : result;
}

export const getUiPreferences = createServerFn({ method: "GET" })
  .validator(z.object({}))
  .handler(async () => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    return getUiPreferencesFromCookie(request?.headers.get("cookie") ?? null);
  });

export const setThemePreference = createServerFn({ method: "POST" })
  .validator(z.object({ theme: z.enum(["light", "dark"]) }))
  .handler(async ({ data }) => {
    const [{ getAuth }, { getRequest, setResponseHeader }] = await Promise.all([
      import("../../auth/server/auth"),
      import("@tanstack/react-start/server"),
    ]);
    const request = getRequest();
    if (!request) {
      return {
        ok: false as const,
        error: {
          code: "UNAUTHENTICATED" as const,
          message: "No request",
        },
      };
    }

    return handleSetThemePreference({
      auth: getAuth(),
      request,
      theme: data.theme,
      setCookie: (cookie) => setResponseHeader("Set-Cookie", cookie),
    });
  });

export const setSidebarPreference = createServerFn({ method: "POST" })
  .validator(z.object({ sidebar: z.enum(["expanded", "collapsed"]) }))
  .handler(async ({ data }) => {
    const [{ getAuth }, { getRequest, setResponseHeader }] = await Promise.all([
      import("../../auth/server/auth"),
      import("@tanstack/react-start/server"),
    ]);
    const request = getRequest();
    if (!request) {
      return {
        ok: false as const,
        error: {
          code: "UNAUTHENTICATED" as const,
          message: "No request",
        },
      };
    }

    return handleSetSidebarPreference({
      auth: getAuth(),
      request,
      sidebar: data.sidebar,
      setCookie: (cookie) => setResponseHeader("Set-Cookie", cookie),
    });
  });
