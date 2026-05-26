import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { runHealthCheck } from "@/shared/lib/api-client/health-check";
import { queryKeys } from "@/shared/lib/query-keys";

export function useHealthStatusActions() {
  const queryClient = useQueryClient();
  const [isGlobalRunning, setIsGlobalRunning] = useState(false);
  const [runningModels, setRunningModels] = useState<Set<string>>(new Set());

  const invalidateQueries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.healthCheckLatest,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.healthCheckSummary,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.healthCheckResults({ limit: 10, offset: 0 }),
    });
  }, [queryClient]);

  const triggerRun = useCallback(async () => {
    setIsGlobalRunning(true);
    try {
      await runHealthCheck();
      await invalidateQueries();
    } finally {
      setIsGlobalRunning(false);
    }
  }, [invalidateQueries]);

  const triggerSingleRun = useCallback(
    async (modelName: string) => {
      setRunningModels((prev) => new Set(prev).add(modelName));
      try {
        await runHealthCheck([modelName]);
        await invalidateQueries();
      } finally {
        setRunningModels((prev) => {
          const next = new Set(prev);
          next.delete(modelName);
          return next;
        });
      }
    },
    [invalidateQueries],
  );

  const isModelRunning = useCallback(
    (modelName: string) => runningModels.has(modelName),
    [runningModels],
  );

  return {
    triggerRun,
    triggerSingleRun,
    isModelRunning,
    isGlobalRunning,
  };
}
