import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";

import { AccountMenu } from "../components/app-shell/account-menu";
import { AppShell } from "../components/app-shell/app-shell";
import {
  getUiPreferences,
  setSidebarPreference,
  setThemePreference,
} from "../server/ui-preferences.functions";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const [{ getSession }, preferences] = await Promise.all([
      import("../server/auth/get-session.functions"),
      getUiPreferences({ data: {} }),
    ]);
    const result = await getSession({ data: {} });

    if (!result.ok) {
      throw redirect({
        to: "/login",
        search: { returnTo: location.pathname, inviteToken: undefined },
      });
    }

    return { preferences, session: result.session };
  },
  errorComponent: ({ error: _error }) => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Error</h1>
          <p className="mt-4 text-gray-600">
            An error occurred while loading this page.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block text-indigo-600 hover:underline"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { preferences: initialPreferences, session } = Route.useRouteContext();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [preferences, setPreferences] = useState(initialPreferences);

  const handleThemeChange = async (theme: "light" | "dark") => {
    const result = await setThemePreference({ data: { theme } });
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(result.theme);
    setPreferences((current) => ({ ...current, theme: result.theme }));
  };

  const handleSidebarChange = async (sidebar: "expanded" | "collapsed") => {
    const result = await setSidebarPreference({ data: { sidebar } });
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    setPreferences((current) => ({ ...current, sidebar: result.sidebar }));
  };

  return (
    <AppShell
      accountMenu={
        <AccountMenu
          email={session.user.email}
          name={session.user.name}
          role={session.user.role}
        />
      }
      onSidebarChange={handleSidebarChange}
      onThemeChange={handleThemeChange}
      pathname={pathname}
      sidebar={preferences.sidebar}
      theme={preferences.theme}
    >
      <Outlet />
    </AppShell>
  );
}
