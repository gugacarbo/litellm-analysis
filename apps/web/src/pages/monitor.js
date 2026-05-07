import { AlertTriangle, BarChart3, Clock, Radar, Radio } from "lucide-react";
import { useEffect } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from "react-router-dom";
import { MetricCard } from "../components/metric-card";
import { AlertDetailDialog } from "../components/monitor/alert-detail-dialog";
import { AlertHistoryTable } from "../components/monitor/alert-history-table";
import { AlertsByTypeChart } from "../components/monitor/alerts-by-type-chart";
import { ConnectionBadge } from "../components/monitor/connection-badge";
import { SeverityBreakdownChart } from "../components/monitor/severity-breakdown-chart";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { HealthStatusContent } from "./health-status";
import { useMonitorPageState } from "./monitor/use-monitor-page";
export function MonitorPage() {
  const state = useMonitorPageState();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab =
    searchParams.get("tab") === "health-check" ? "health-check" : "monitor";
  useEffect(() => {
    if (state.error) {
      console.error("[Monitor] Error:", state.error);
    }
  }, [state.error]);
  const handleTabChange = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "health-check") {
      next.set("tab", "health-check");
    } else {
      next.delete("tab");
    }
    setSearchParams(next, { replace: true });
  };
  return _jsx(PageLayout, {
    title: "Monitor",
    subtitle: "Real-time model health and anomaly detection",
    icon: Radar,
    variant: "flex",
    buttons: _jsx(ConnectionBadge, {
      status: state.websocketStatus,
      alertCount: state.mergedAlertCount,
    }),
    children: _jsxs(Tabs, {
      value: activeTab,
      onValueChange: handleTabChange,
      className: "space-y-2",
      children: [
        _jsxs(TabsList, {
          children: [
            _jsx(TabsTrigger, { value: "monitor", children: "Monitor" }),
            _jsx(TabsTrigger, {
              value: "health-check",
              children: "Health Check",
            }),
          ],
        }),
        _jsxs(TabsContent, {
          value: "monitor",
          className: "space-y-4",
          children: [
            _jsx(AlertDetailDialog, {
              alert: state.selectedAlert,
              open: state.selectedAlert !== null,
              onOpenChange: (open) => {
                if (!open) state.onClearSelectedAlert();
              },
              onAcknowledge: (id) => {
                state.acknowledgeAlert(id);
                state.onClearSelectedAlert();
              },
            }),
            _jsxs("div", {
              className: "grid grid-cols-2 gap-3 md:grid-cols-4",
              children: [
                _jsx(MetricCard, {
                  icon: AlertTriangle,
                  title: "Active Alerts",
                  value: state.stats?.active_alerts ?? 0,
                  colorScheme: "red",
                  size: "sm",
                  loading: state.isLoading,
                }),
                _jsx(MetricCard, {
                  icon: Radio,
                  title: "Models Tracked",
                  value: state.models.length,
                  colorScheme: "blue",
                  size: "sm",
                  loading: state.isLoading,
                }),
                _jsx(MetricCard, {
                  icon: Clock,
                  title: "Last 24h Alerts",
                  value: state.stats?.last_24h_count ?? 0,
                  colorScheme: "amber",
                  size: "sm",
                  loading: state.isLoading,
                }),
                _jsx(MetricCard, {
                  icon: BarChart3,
                  title: "Avg P95 Latency",
                  value: state.healthStatsSummary.avgP95Latency
                    ? `${state.healthStatsSummary.avgP95Latency.toFixed(0)}ms`
                    : "—",
                  colorScheme: "violet",
                  size: "sm",
                  loading: state.isLoading,
                }),
              ],
            }),
            _jsx("div", {
              className: "min-h-0 flex-1",
              children: _jsx(AlertHistoryTable, {
                lastAlerts: state.lastAlerts,
                models: state.sortedModels,
                onAcknowledge: state.acknowledgeAlert,
                isAcknowledging: state.isAcknowledging,
                onAlertClick: state.onSelectAlert,
              }),
            }),
            _jsxs("div", {
              children: [
                _jsx("h2", {
                  className: "mb-4 text-lg font-semibold",
                  children: "Charts",
                }),
                _jsxs("div", {
                  className: "grid grid-cols-1 gap-2 lg:grid-cols-2",
                  children: [
                    _jsx(SeverityBreakdownChart, {
                      data: state.severityBreakdown,
                      loading: state.isLoading,
                    }),
                    _jsx(AlertsByTypeChart, {
                      data: state.alertsByTypeData,
                      loading: state.isLoading,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        _jsx(TabsContent, {
          value: "health-check",
          children: _jsx(HealthStatusContent, { embedded: true }),
        }),
      ],
    }),
  });
}
export default MonitorPage;
