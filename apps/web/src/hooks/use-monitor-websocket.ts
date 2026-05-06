import { useEffect, useRef, useState } from "react";
import { getActiveAlerts } from "../lib/api-client/monitor";
import { WsClient } from "../lib/api-client/ws-client";
import type {
  ConnectionState,
  HealthUpdateData,
  MonitorAlert,
  WsMessage,
} from "../pages/monitor/monitor-types";

const MAX_BUFFERED_ALERTS = 50;

interface UseMonitorWebSocketResult {
  status: ConnectionState;
  lastAlerts: MonitorAlert[];
  healthData: HealthUpdateData | null;
  connectionState: ConnectionState;
}

function getWsUrl(): string {
  if (import.meta.env.PROD) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws/monitor`;
  }
  return `ws://${window.location.hostname}:5178/ws/monitor`;
}

export function useMonitorWebSocket(): UseMonitorWebSocketResult {
  const [status, setStatus] = useState<ConnectionState>("disconnected");
  const [lastAlerts, setLastAlerts] = useState<MonitorAlert[]>([]);
  const [healthData, setHealthData] = useState<HealthUpdateData | null>(null);
  const clientRef = useRef<WsClient | null>(null);

  useEffect(() => {
    const client = new WsClient(getWsUrl());
    clientRef.current = client;

    const abortController = new AbortController();

    client.onMessage((message: WsMessage) => {
      if (message.type === "alert") {
        const alert = message.data as MonitorAlert;
        setLastAlerts((prev) => [alert, ...prev].slice(0, MAX_BUFFERED_ALERTS));
      } else if (message.type === "health_update") {
        setHealthData(message.data as HealthUpdateData);
      }
    });
    client.onStatusChange(setStatus);

    client.connect();

    // Fetch initial active alerts
    getActiveAlerts({ signal: abortController.signal })
      .then((res) => {
        if (res.alerts && res.alerts.length > 0) {
          setLastAlerts(res.alerts.slice(0, MAX_BUFFERED_ALERTS));
        }
      })
      .catch(() => {});

    return () => {
      abortController.abort();
      client.destroy();
    };
  }, []);

  return { status, lastAlerts, healthData, connectionState: status };
}
