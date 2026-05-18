import { useHealthStatusActions } from "./use-health-status-actions";
import { useHealthStatusDerived } from "./use-health-status-derived";
import { useHealthStatusState } from "./use-health-status-state";

export function useHealthStatusPage() {
  const state = useHealthStatusState();
  const actions = useHealthStatusActions();
  const derived = useHealthStatusDerived(state.allModelsWithStatus);

  return { state, actions, derived };
}
