import { AlertHistoryTable } from "../components/monitor/alert-history-table";
import { ConnectionBadge } from "../components/monitor/connection-badge";
import { ModelHealthGrid } from "../components/monitor/model-health-grid";
import { Card, CardContent } from "../components/ui/card";
import { useMonitorPageState } from "./monitor/use-monitor-page";

export function MonitorPage() {
  const state = useMonitorPageState();

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Monitor</h1>
        <ConnectionBadge
          status={state.websocketStatus}
          alertCount={state.mergedAlertCount}
        />
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="flex w-1/2 min-w-0 flex-col">
          <div className="flex-1 overflow-auto">
            <AlertHistoryTable
              lastAlerts={state.lastAlerts}
              onAcknowledge={state.acknowledgeAlert}
              isAcknowledging={state.isAcknowledging}
            />
          </div>
        </div>

        <div className="flex w-1/2 min-w-0 flex-col gap-6">
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Active Alerts</p>
                <p className="text-xl font-bold">
                  {state.stats?.active_alerts ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Models Tracked</p>
                <p className="text-xl font-bold">{state.models.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Last 24h Alerts</p>
                <p className="text-xl font-bold">
                  {state.stats?.last_24h_count ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 overflow-auto">
            <ModelHealthGrid models={state.sortedModels} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonitorPage;
