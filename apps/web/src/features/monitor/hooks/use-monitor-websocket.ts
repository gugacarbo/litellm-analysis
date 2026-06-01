import { useEffect, useRef, useState } from "react";
import { getActiveAlerts } from "@/shared/lib/api-client/monitor";
import { WsClient } from "@/shared/lib/api-client/ws-client";
import type { ConnectionState, WsMessage } from "@/shared/types/connection";
import type { HealthUpdateData, MonitorAlert } from "@/shared/types/monitor";

const MAX_BUFFERED_ALERTS = 50;

interface UseMonitorWebSocketResult {
  status: ConnectionState;
  lastAlerts: MonitorAlert[];
  healthData: HealthUpdateData | null;
  connectionState: ConnectionState;
}

function getWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/monitor`;
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
