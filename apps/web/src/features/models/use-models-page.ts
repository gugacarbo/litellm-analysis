import { useQuery } from "@tanstack/react-query";
import { getModelsWithConfig } from "@/shared/lib/api-client";
import { mergeRegistryModelsWithConfigAliases } from "./model-display";
import { useLatestHealthChecks } from "./use-latest-health-checks";

/**
 * Deprecated web surface: it intentionally exposes model data only. Model
 * administration moved to apps/ui, which is the only writer surface.
 */
export function useModelsPage() {
  const modelsQuery = useQuery({
    queryKey: ["models-with-config"],
    queryFn: getModelsWithConfig,
  });
  const {
    checksByModel: healthChecksByModel,
    getCheck: getHealthCheck,
    query: healthChecksQuery,
  } = useLatestHealthChecks();

  return {
    models: mergeRegistryModelsWithConfigAliases(
      modelsQuery.data?.models ?? [],
    ),
    counts: modelsQuery.data?.counts ?? {
      synced: 0,
      configOnly: 0,
      registryOnly: 0,
      total: 0,
    },
    modelsQuery,
    healthChecksByModel,
    getHealthCheck,
    healthChecksQuery,
  };
}
