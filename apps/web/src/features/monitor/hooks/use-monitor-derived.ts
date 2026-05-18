import { useMemo } from "react";
import type { ModelHealthEntry, MonitorAlert } from "./monitor-types";
import { formatAnomalyType } from "./monitor-utils";

export interface SeveritySlice {
  name: string;
  value: number;
  color: string;
}

export interface AlertsByTypeItem {
  type: string;
  count: number;
}

interface HealthStatsSummary {
  avgP95Latency: number | null;
  totalRequests: number;
  avgSuccessRate: number | null;
}

interface UseMonitorDerivedResult {
  mergedAlertCount: number;
  sortedModels: ModelHealthEntry[];
  alertsBySeverity: Record<string, number>;
  severityBreakdown: SeveritySlice[];
  alertsByTypeData: AlertsByTypeItem[];
  healthStatsSummary: HealthStatsSummary;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

export function useMonitorDerived(
  lastAlerts: MonitorAlert[],
  activeAlerts: Array<{ id: number; severity: string }>,
  models: ModelHealthEntry[],
  alertsByType: Record<string, number>,
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
    function getLatestTs(m: ModelHealthEntry): number {
      const candidates: string[] = [];
      if (m.stats?.last_success_at) candidates.push(m.stats.last_success_at);
      if (m.stats?.last_error_at) candidates.push(m.stats.last_error_at);
      if (m.last_error_at) candidates.push(m.last_error_at);
      if (candidates.length === 0) return 0;
      return Math.max(...candidates.map((d) => new Date(d).getTime()));
    }
    return [...models].sort((a, b) => getLatestTs(b) - getLatestTs(a));
  }, [models]);

  const alertsBySeverity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const alert of lastAlerts) {
      const sev = alert.severity;
      counts[sev] = (counts[sev] ?? 0) + 1;
    }
    return counts;
  }, [lastAlerts]);

  const severityBreakdown = useMemo(() => {
    const slices: SeveritySlice[] = [];
    const totals = alertsBySeverity;
    for (const [name, value] of Object.entries(totals)) {
      if (value > 0) {
        slices.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: SEVERITY_COLORS[name] ?? "#6b7280",
        });
      }
    }
    return slices;
  }, [alertsBySeverity]);

  const alertsByTypeData = useMemo(() => {
    return Object.entries(alertsByType)
      .map(([type, count]) => ({
        type: formatAnomalyType(type),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [alertsByType]);

  const healthStatsSummary = useMemo(() => {
    const withStats = models.filter(
      (
        m,
      ): m is ModelHealthEntry & {
        stats: NonNullable<ModelHealthEntry["stats"]>;
      } => m.stats != null && m.stats.total_requests > 0,
    );
    if (withStats.length === 0) {
      return { avgP95Latency: null, totalRequests: 0, avgSuccessRate: null };
    }
    const p95s = withStats
      .map((m) => m.stats.p95_latency_ms)
      .filter((v): v is number => v != null);
    const successRates = withStats.map(
      (m) => (m.stats.success_count / m.stats.total_requests) * 100,
    );
    return {
      avgP95Latency:
        p95s.length > 0 ? p95s.reduce((a, b) => a + b, 0) / p95s.length : null,
      totalRequests: withStats.reduce(
        (sum, m) => sum + m.stats.total_requests,
        0,
      ),
      avgSuccessRate:
        successRates.length > 0
          ? successRates.reduce((a, b) => a + b, 0) / successRates.length
          : null,
    };
  }, [models]);

  return {
    mergedAlertCount,
    sortedModels,
    alertsBySeverity,
    severityBreakdown,
    alertsByTypeData,
    healthStatsSummary,
  };
}
