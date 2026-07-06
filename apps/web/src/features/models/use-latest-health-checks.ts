import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useHealthStatusWebSocket } from "@/features/health-check/hooks/use-health-status-websocket";
import type { HealthCheckResultEntry } from "@/features/health-check/types/health-status-types";
import { mergeLatestHealthChecks } from "@/features/health-check/utils/health-status-utils";
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
    const latestData = Array.isArray(query.data?.checks) ? query.data.checks : [];
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
