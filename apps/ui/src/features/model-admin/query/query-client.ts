import { QueryClient } from "@tanstack/react-query";

/** A fresh cache is required for each router/request to keep SSR sessions isolated. */
export function createModelAdminQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep route data stable while navigating or returning focus to the app.
        // Mutations explicitly invalidate the affected queries when a refresh is
        // actually required.
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });
}
