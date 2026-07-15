import { useQuery } from "@tanstack/react-query";
import { getAllProviders, getDefaultProvider } from "@/shared/lib/api-client/providers";

/** Deprecated web surface: provider data is available for inspection only. */
export function useProvidersPage() {
  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: getAllProviders,
  });
  const defaultProviderQuery = useQuery({
    queryKey: ["default-provider"],
    queryFn: getDefaultProvider,
  });

  return {
    providers: providersQuery.data ?? [],
    defaultProvider: defaultProviderQuery.data?.defaultProvider ?? null,
    isLoading: providersQuery.isLoading || defaultProviderQuery.isLoading,
    error: providersQuery.error ?? defaultProviderQuery.error ?? null,
  };
}
