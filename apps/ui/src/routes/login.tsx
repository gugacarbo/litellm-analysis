import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "../features/auth/components/login-page";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: (search.returnTo as string) || "/",
    inviteToken: search.inviteToken as string | undefined,
  }),
  component: LoginRoute,
});

function LoginRoute() {
  return <LoginPage {...Route.useSearch()} />;
}
