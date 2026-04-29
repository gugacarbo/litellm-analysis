import { useMemo } from "react";
import type { ModelHealthEntry, MonitorAlert } from "./monitor-types";
import { STATUS_ORDER } from "./monitor-utils";

export interface UseMonitorDerivedResult {
  mergedAlertCount: number;
  sortedModels: ModelHealthEntry[];
  alertsBySeverity: Record<string, number>;
}

export function useMonitorDerived(
  lastAlerts: MonitorAlert[],
  activeAlerts: Array<{ id: number; severity: string }>,
  models: ModelHealthEntry[],
): UseMonitorDerivedResult {
  const mergedAlertCount = useMemo(() => {
    if (lastAlerts.length === 0) return activeAlerts.length;
    const wsIds = new Set(lastAlerts.map((a) => a.id));
    const existingIds = new Set(activeAlerts.map((a) => a.id));
    let count = activeAlerts.length;
    for (const id of wsIds) {
      if (!existingIds.has(id)) count++;
    }
    return count;
  }, [lastAlerts, activeAlerts]);

  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 99;
      const orderB = STATUS_ORDER[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.model.localeCompare(b.model);
    });
  }, [models]);

  const alertsBySeverity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const alert of lastAlerts) {
      const sev = alert.severity;
      counts[sev] = (counts[sev] ?? 0) + 1;
    }
    return counts;
  }, [lastAlerts]);

  return {
    mergedAlertCount,
    sortedModels,
    alertsBySeverity,
  };
}
