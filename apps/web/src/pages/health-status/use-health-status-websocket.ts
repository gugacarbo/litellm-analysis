import { useEffect, useRef, useState } from "react";
import { WsClient } from "../../lib/api-client/ws-client";
import type {
  ConnectionState,
  HealthCheckResultEntry,
  HealthCheckUpdatePayload,
} from "./health-status-types";

function getWsUrl(): string {
  if (import.meta.env.PROD) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws/monitor`;
  }
  return `ws://${window.location.hostname}:5178/ws/monitor`;
}

interface UseHealthStatusWebSocketResult {
  status: ConnectionState;
  latestResults: HealthCheckResultEntry[] | null;
}

export function useHealthStatusWebSocket(): UseHealthStatusWebSocketResult {
  const [status, setStatus] = useState<ConnectionState>("disconnected");
  const [latestResults, setLatestResults] = useState<
    HealthCheckResultEntry[] | null
  >(null);
  const clientRef = useRef<WsClient | null>(null);

  useEffect(() => {
    const client = new WsClient(getWsUrl());
    clientRef.current = client;

    client.onMessage((message) => {
      if (message.type === "health_check_update") {
        const payload = message.data as HealthCheckUpdatePayload;
        setLatestResults(payload.results);
      }
    });
    client.onStatusChange(setStatus);

    client.connect();

    return () => {
      client.destroy();
    };
  }, []);

  return { status, latestResults };
}
