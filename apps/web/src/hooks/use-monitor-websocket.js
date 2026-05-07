import { useEffect, useRef, useState } from "react";
import { getActiveAlerts } from "../lib/api-client/monitor";
import { WsClient } from "../lib/api-client/ws-client";

const MAX_BUFFERED_ALERTS = 50;
function getWsUrl() {
  if (import.meta.env.PROD) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws/monitor`;
  }
  return `ws://${window.location.hostname}:5178/ws/monitor`;
}
export function useMonitorWebSocket() {
  const [status, setStatus] = useState("disconnected");
  const [lastAlerts, setLastAlerts] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const clientRef = useRef(null);
  useEffect(() => {
    const client = new WsClient(getWsUrl());
    clientRef.current = client;
    const abortController = new AbortController();
    client.onMessage((message) => {
      if (message.type === "alert") {
        const alert = message.data;
        setLastAlerts((prev) => [alert, ...prev].slice(0, MAX_BUFFERED_ALERTS));
      } else if (message.type === "health_update") {
        setHealthData(message.data);
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
