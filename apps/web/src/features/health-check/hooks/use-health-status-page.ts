import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { queryKeys } from "@/shared/lib/query-keys";
import { useHealthStatusDerived } from "./use-health-status-derived";
import { useHealthStatusState } from "./use-health-status-state";
import { useHealthStatusWebSocket } from "./use-health-status-websocket";

export function useHealthStatusPage() {
  const queryClient = useQueryClient();
  const {
    status,
    latestResults,
    rejectedMap,
    runningExecutions,
    partialMessages,
  } = useHealthStatusWebSocket();
  const state = useHealthStatusState({
    wsStatus: status,
    wsResults: latestResults,
  });
  const actions = useMemo(
    () => ({
      isGlobalRunning: false,
      isModelRunning: (_modelName: string) => false,
      clearRunningModel: (_modelName: string) => undefined,
      triggerSingleRun: (_modelName: string) => undefined,
    }),
    [],
  );
  const derived = useHealthStatusDerived(state.allModelsWithStatus);
  const lastWsRefreshAtRef = useRef(0);

  useEffect(() => {
    for (const result of latestResults) {
      actions.clearRunningModel(result.modelName);
    }
  }, [latestResults, actions]);

  useEffect(() => {
    for (const [modelName] of rejectedMap) {
      actions.clearRunningModel(modelName);
    }
  }, [rejectedMap, actions]);

  useEffect(() => {
    if (latestResults.length === 0) {
      return;
    }

    const newestCheckedAt = latestResults.reduce(
      (max, result) => Math.max(max, result.checkedAt),
      0,
    );
    if (newestCheckedAt <= lastWsRefreshAtRef.current) {
      return;
    }

    lastWsRefreshAtRef.current = newestCheckedAt;
    void Promise.all([
      queryClient.refetchQueries({
        queryKey: queryKeys.healthCheckLatest,
      }),
      queryClient.refetchQueries({
        queryKey: queryKeys.healthCheckSummary,
      }),
    ]);
  }, [latestResults, queryClient]);

  return { state, actions, derived, runningExecutions, partialMessages };
}
