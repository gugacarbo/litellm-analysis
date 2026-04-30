import { AlertTriangle, BarChart3, Clock, Radar, Radio } from "lucide-react";
import { useEffect } from "react";
import { PageLayout } from "../components/layout/page-layout/page-layout";
import { MetricCard } from "../components/metric-card";
import { AlertDetailDialog } from "../components/monitor/alert-detail-dialog";
import { AlertHistoryTable } from "../components/monitor/alert-history-table";
import { AlertsByTypeChart } from "../components/monitor/alerts-by-type-chart";
import { ConnectionBadge } from "../components/monitor/connection-badge";
import { SeverityBreakdownChart } from "../components/monitor/severity-breakdown-chart";
import { useMonitorPageState } from "./monitor/use-monitor-page";

export function MonitorPage() {
  const state = useMonitorPageState();

  useEffect(() => {
    if (state.error) {
      console.error("[Monitor] Error:", state.error);
    }
  }, [state.error]);

  return (
    <PageLayout
      title="Monitor"
      subtitle="Real-time model health and anomaly detection"
      icon={Radar}
      variant="flex"
      buttons={
        <ConnectionBadge
          status={state.websocketStatus}
          alertCount={state.mergedAlertCount}
        />
      }
    >
      <AlertDetailDialog
        alert={state.selectedAlert}
        open={state.selectedAlert !== null}
        onOpenChange={(open) => {
          if (!open) state.onClearSelectedAlert();
        }}
        onAcknowledge={(id) => {
          state.acknowledgeAlert(id);
          state.onClearSelectedAlert();
        }}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          icon={AlertTriangle}
          title="Active Alerts"
          value={state.stats?.active_alerts ?? 0}
          colorScheme="red"
          size="sm"
          loading={state.isLoading}
        />
        <MetricCard
          icon={Radio}
          title="Models Tracked"
          value={state.models.length}
          colorScheme="blue"
          size="sm"
          loading={state.isLoading}
        />
        <MetricCard
          icon={Clock}
          title="Last 24h Alerts"
          value={state.stats?.last_24h_count ?? 0}
          colorScheme="amber"
          size="sm"
          loading={state.isLoading}
        />
        <MetricCard
          icon={BarChart3}
          title="Avg P95 Latency"
          value={
            state.healthStatsSummary.avgP95Latency
              ? `${state.healthStatsSummary.avgP95Latency.toFixed(0)}ms`
              : "—"
          }
          colorScheme="violet"
          size="sm"
          loading={state.isLoading}
        />
      </div>

      <div className="min-h-0 flex-1">
        <AlertHistoryTable
          lastAlerts={state.lastAlerts}
          models={state.sortedModels}
          onAcknowledge={state.acknowledgeAlert}
          isAcknowledging={state.isAcknowledging}
          onAlertClick={state.onSelectAlert}
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Charts</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SeverityBreakdownChart
            data={state.severityBreakdown}
            loading={state.isLoading}
          />
          <AlertsByTypeChart
            data={state.alertsByTypeData}
            loading={state.isLoading}
          />
        </div>
      </div>
    </PageLayout>
  );
}

export default MonitorPage;
