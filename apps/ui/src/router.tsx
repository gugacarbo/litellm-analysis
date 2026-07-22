import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createModelAdminQueryClient } from "@/features/model-admin/query/query-client";
import { routeTree } from "@/routeTree.gen";

export function getRouter() {
  const queryClient = createModelAdminQueryClient();
  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Route-intent preloading can race while its ephemeral match cache is
    // being reconciled. Query data remains cached by TanStack Query after a
    // normal navigation, so do not put every Link through that extra path.
    defaultPreload: false,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
