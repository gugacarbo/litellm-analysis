import { useEffect } from "react";
import { useHealthStatusActions } from "./use-health-status-actions";
import { useHealthStatusDerived } from "./use-health-status-derived";
import { useHealthStatusState } from "./use-health-status-state";
import { useHealthStatusWebSocket } from "./use-health-status-websocket";

export function useHealthStatusPage() {
  const { status, latestResults, rejectedMap, send } =
    useHealthStatusWebSocket();
  const state = useHealthStatusState({
    wsStatus: status,
    wsResults: latestResults,
  });
  const actions = useHealthStatusActions({ send });
  const derived = useHealthStatusDerived(state.allModelsWithStatus);

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

  return { state, actions, derived };
}
