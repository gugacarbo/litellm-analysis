import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { runHealthCheck } from "../../lib/api-client/health-check";
import { queryKeys } from "../../lib/query-keys";
export function useHealthStatusActions() {
  const queryClient = useQueryClient();
  const [globalPendingCount, setGlobalPendingCount] = useState(0);
  const [runningModelCounts, setRunningModelCounts] = useState({});
  const invalidateHealthQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.healthCheckLatest,
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.healthCheckSummary,
    });
    queryClient.invalidateQueries({
      queryKey: ["health-check", "results"],
    });
  }, [queryClient]);
  const isModelRunning = useCallback(
    (modelName) => (runningModelCounts[modelName] ?? 0) > 0,
    [runningModelCounts],
  );
  const triggerRun = useCallback(
    (models) => {
      const singleModelName = models?.length === 1 ? models[0] : null;
      if (singleModelName) {
        setRunningModelCounts((prev) => ({
          ...prev,
          [singleModelName]: (prev[singleModelName] ?? 0) + 1,
        }));
      } else {
        setGlobalPendingCount((count) => count + 1);
      }
      void runHealthCheck(models)
        .catch(() => {
          // UI refresh already handles failed requests
        })
        .finally(() => {
          invalidateHealthQueries();
          if (singleModelName) {
            setRunningModelCounts((prev) => {
              const current = prev[singleModelName] ?? 0;
              if (current <= 1) {
                const next = { ...prev };
                delete next[singleModelName];
                return next;
              }
              return {
                ...prev,
                [singleModelName]: current - 1,
              };
            });
          } else {
            setGlobalPendingCount((count) => Math.max(0, count - 1));
          }
        });
    },
    [invalidateHealthQueries],
  );
  const triggerSingleRun = useCallback(
    (modelName) => {
      triggerRun([modelName]);
    },
    [triggerRun],
  );
  return {
    triggerRun,
    triggerSingleRun,
    isGlobalRunning: globalPendingCount > 0,
    isModelRunning,
  };
}
