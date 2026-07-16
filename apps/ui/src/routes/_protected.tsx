import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";

import { AccountMenu } from "@/features/app-shell/components/account-menu";
import { AppShell } from "@/features/app-shell/components/app-shell";
import {
  getUiPreferences,
  setSidebarPreference,
  setThemePreference,
} from "@/features/ui-preferences/server/ui-preferences.functions";
import { Card, CardContent } from "@/shared/components/ui/card";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const [{ getSession }, preferences] = await Promise.all([
      import("@/features/auth/server/get-session.functions"),
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
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-destructive">
              Access Error
            </h1>
            <p className="text-muted-foreground">
              An error occurred while loading this page.
            </p>
            <a href="/login" className="text-primary hover:underline">
              Go to login
            </a>
          </CardContent>
        </Card>
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
          onThemeChange={handleThemeChange}
          role={session.user.role}
          theme={preferences.theme}
        />
      }
      onSidebarChange={handleSidebarChange}
      pathname={pathname}
      userRole={session.user.role}
      sidebar={preferences.sidebar}
    >
      <Outlet />
    </AppShell>
  );
}
