import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useMonitorWebSocket } from "../../hooks/use-monitor-websocket";
import {
  getActiveAlerts,
  getModelsHealth,
  getMonitorStats,
  type MonitorStats,
} from "@/shared/lib/api-client/monitor";
import type {
  ConnectionState,
  HealthUpdateData,
  ModelHealthEntry,
  MonitorAlert,
} from "./monitor-types";

interface UseMonitorStateResult {
  websocketStatus: ConnectionState;
  lastAlerts: MonitorAlert[];
  healthData: HealthUpdateData | null;
  stats: MonitorStats | undefined;
  models: ModelHealthEntry[];
  activeAlerts: Array<{ id: number; severity: string }>;
  isLoading: boolean;
  error: string | null;
}

export function useMonitorState(): UseMonitorStateResult {
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

  const isLoading =
    (statsQuery.isPending && !statsQuery.data) ||
    (healthQuery.isPending && !healthQuery.data) ||
    (activeAlertsQuery.isPending && !activeAlertsQuery.data);

  const firstError =
    statsQuery.error instanceof Error
      ? statsQuery.error.message
      : healthQuery.error instanceof Error
        ? healthQuery.error.message
        : activeAlertsQuery.error instanceof Error
          ? activeAlertsQuery.error.message
          : null;

  return {
    websocketStatus,
    lastAlerts,
    healthData,
    stats: statsQuery.data,
    models: healthData?.models ?? healthQuery.data?.models ?? [],
    activeAlerts,
    isLoading,
    error: firstError,
  };
}
