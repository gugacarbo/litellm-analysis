import { AlertTriangle, BarChart3, Clock, Radar, Radio } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MetricCard } from "@/shared/components/metric-card";
import { PageLayout } from "@/shared/components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { HealthStatusContent } from "../health-status";
import { AlertDetailDialog } from "./components/alert-detail-dialog";
import { AlertHistoryTable } from "./components/alert-history-table";
import { AlertsByTypeChart } from "./components/alerts-by-type-chart";
import { ConnectionBadge } from "./components/connection-badge";
import { SeverityBreakdownChart } from "./components/severity-breakdown-chart";
import { useMonitorPageState } from "./hooks/use-monitor-page";

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

  const handleTabChange = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "health-check") {
      next.set("tab", "health-check");
    } else {
      next.delete("tab");
    }
    setSearchParams(next, { replace: true });
  };

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
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-2"
      >
        <TabsList>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="health-check">Health Check</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-4">
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
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
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
        </TabsContent>

        <TabsContent value="health-check">
          <HealthStatusContent embedded />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
