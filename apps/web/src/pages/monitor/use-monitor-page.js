import { useMonitorActions } from "./use-monitor-actions";
import { useMonitorDerived } from "./use-monitor-derived";
import { useMonitorState } from "./use-monitor-state";
export function useMonitorPageState() {
  const state = useMonitorState();
  const derived = useMonitorDerived(
    state.lastAlerts,
    state.activeAlerts,
    state.models,
    state.stats?.alerts_by_type ?? {},
  );
  const actions = useMonitorActions();
  return {
    ...state,
    ...derived,
    ...actions,
  };
}
