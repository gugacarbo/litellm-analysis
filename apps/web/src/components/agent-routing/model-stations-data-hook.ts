import { useQuery } from "@tanstack/react-query";
import type { ModelStatistics } from "../../lib/api-client/analytics";
import { getModelStatistics } from "../../lib/api-client/analytics";
import { queryKeys } from "../../lib/query-keys";

export type EnrichedModelGroup = {
  modelName: string;
  agents: EntityItem[];
  categories: EntityItem[];
  totalFallbacks: number;
  stats?: ModelStatistics;
};

export type EntityItem = {
  key: string;
  name: string;
  icon?: string;
};

export function useModelStationsData(days = 7) {
  const statsQuery = useQuery({
    queryKey: queryKeys.modelStatistics(days),
    queryFn: () => getModelStatistics(days),
    refetchInterval: 30_000,
  });

  const statsMap = new Map<string, ModelStatistics>();
  if (statsQuery.data) {
    for (const stat of statsQuery.data) {
      statsMap.set(stat.model, stat);
    }
  }

  return {
    statsMap,
    statsLoading: statsQuery.isPending && !statsQuery.data,
    statsError:
      statsQuery.error instanceof Error ? statsQuery.error.message : null,
    refetch: statsQuery.refetch,
  };
}
