import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useHealthStatusWebSocket } from "@/features/monitor/hooks/use-health-status-websocket";
import type { HealthCheckResultEntry } from "@/features/monitor/types/health-status-types";
import { mergeLatestHealthChecks } from "@/features/monitor/utils/health-status-utils";
import { getLatestHealthChecks } from "@/shared/lib/api-client/health-check";
import { queryKeys } from "@/shared/lib/query-keys";

const REFETCH_INTERVAL = 30_000;

export function useLatestHealthChecks() {
  const { latestResults } = useHealthStatusWebSocket();

  const query = useQuery({
    queryKey: queryKeys.healthCheckLatest,
    queryFn: getLatestHealthChecks,
    refetchInterval: REFETCH_INTERVAL,
  });

  const checksByModel = useMemo(() => {
    const latestData = query.data?.checks ?? [];
    return mergeLatestHealthChecks(latestData, latestResults);
  }, [query.data, latestResults]);

  const getCheck = (modelName: string): HealthCheckResultEntry | undefined =>
    checksByModel.get(modelName);

  return {
    checksByModel,
    getCheck,
    query,
  };
}
