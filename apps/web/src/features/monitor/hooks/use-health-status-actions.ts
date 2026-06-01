import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { runHealthCheck } from "@/shared/lib/api-client/health-check";
import { queryKeys } from "@/shared/lib/query-keys";

interface UseHealthStatusActionsOptions {
  send: (msg: object) => void;
}

export function useHealthStatusActions({
  send,
}: UseHealthStatusActionsOptions) {
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
    (modelName: string) => {
      setRunningModels((prev) =>
        prev.has(modelName) ? prev : new Set(prev).add(modelName),
      );
      send({ type: "request_health_check", data: { modelName } });
    },
    [send],
  );

  const clearRunningModel = useCallback((modelName: string) => {
    setRunningModels((prev) => {
      if (!prev.has(modelName)) return prev;
      const next = new Set(prev);
      next.delete(modelName);
      return next;
    });
  }, []);

  const isModelRunning = useCallback(
    (modelName: string) => runningModels.has(modelName),
    [runningModels],
  );

  return {
    triggerRun,
    triggerSingleRun,
    isModelRunning,
    clearRunningModel,
    isGlobalRunning,
  };
}
