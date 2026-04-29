import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AlertHistoryTable } from "../components/monitor/alert-history-table";
import { ConnectionBadge } from "../components/monitor/connection-badge";
import { ModelHealthGrid } from "../components/monitor/model-health-grid";
import { Card, CardContent } from "../components/ui/card";
import { useMonitorWebSocket } from "../hooks/use-monitor-websocket";
import {
  getActiveAlerts,
  getModelsHealth,
  getMonitorStats,
} from "../lib/api-client/monitor";

export function MonitorPage() {
  const {
    status: websocketStatus,
    lastAlerts,
    healthData,
  } = useMonitorWebSocket();

  const [activeAlerts, setActiveAlerts] = useState<
    Array<{ id: number; severity: string }>
  >([]);

  const statsQuery = useQuery({
    queryKey: ["monitor", "stats"],
    queryFn: getMonitorStats,
    refetchInterval: 30_000,
  });

  const healthQuery = useQuery({
    queryKey: ["monitor", "health"],
    queryFn: getModelsHealth,
    refetchInterval: 30_000,
  });

  const activeAlertsQuery = useQuery({
    queryKey: ["monitor", "active-alerts"],
    queryFn: getActiveAlerts,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (activeAlertsQuery.data?.alerts) {
      setActiveAlerts(activeAlertsQuery.data.alerts);
    }
  }, [activeAlertsQuery.data]);

  // Merge real-time WS alerts into the active alerts list
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

  const stats = statsQuery.data;
  const models = healthData?.models ?? healthQuery.data?.models ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Monitor</h1>
        <ConnectionBadge
          status={websocketStatus}
          alertCount={mergedAlertCount}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Alerts</p>
            <p className="text-2xl font-bold">{stats?.active_alerts ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Models Tracked</p>
            <p className="text-2xl font-bold">{models.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Last 24h Alerts</p>
            <p className="text-2xl font-bold">{stats?.last_24h_count ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ModelHealthGrid models={models} />
        <AlertHistoryTable />
      </div>
    </div>
  );
}

export default MonitorPage;
