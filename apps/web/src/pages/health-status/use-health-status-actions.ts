import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { runHealthCheck } from "@/shared/lib/api-client/health-check";
import { queryKeys } from "@/shared/lib/query-keys";

interface UseHealthStatusActionsResult {
  triggerRun: (models?: string[]) => void;
  triggerSingleRun: (modelName: string) => void;
  isGlobalRunning: boolean;
  isModelRunning: (modelName: string) => boolean;
}

export function useHealthStatusActions(): UseHealthStatusActionsResult {
  const queryClient = useQueryClient();
  const [globalPendingCount, setGlobalPendingCount] = useState(0);
  const [runningModelCounts, setRunningModelCounts] = useState<
    Record<string, number>
  >({});

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
    (modelName: string) => (runningModelCounts[modelName] ?? 0) > 0,
    [runningModelCounts],
  );

  const triggerRun = useCallback(
    (models?: string[]) => {
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
    (modelName: string) => {
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
