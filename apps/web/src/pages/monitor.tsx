import { AlertHistoryTable } from "../components/monitor/alert-history-table";
import { ConnectionBadge } from "../components/monitor/connection-badge";
import { ModelHealthGrid } from "../components/monitor/model-health-grid";
import { Card, CardContent } from "../components/ui/card";
import { useMonitorPageState } from "./monitor/use-monitor-page";

export function MonitorPage() {
  const state = useMonitorPageState();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Monitor</h1>
        <ConnectionBadge
          status={state.websocketStatus}
          alertCount={state.mergedAlertCount}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Alerts</p>
            <p className="text-2xl font-bold">
              {state.stats?.active_alerts ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Models Tracked</p>
            <p className="text-2xl font-bold">{state.models.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Last 24h Alerts</p>
            <p className="text-2xl font-bold">
              {state.stats?.last_24h_count ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ModelHealthGrid models={state.sortedModels} />
        <AlertHistoryTable
          lastAlerts={state.lastAlerts}
          onAcknowledge={state.acknowledgeAlert}
          isAcknowledging={state.isAcknowledging}
        />
      </div>
    </div>
  );
}

export default MonitorPage;
