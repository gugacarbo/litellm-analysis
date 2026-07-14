import { QueryClient } from "@tanstack/react-query";

/** A fresh cache is required for each router/request to keep SSR sessions isolated. */
export function createModelAdminQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}
