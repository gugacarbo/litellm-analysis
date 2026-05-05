import { useEffect, useRef, useState } from "react";
import type {
  ConnectionState,
  HealthCheckResultEntry,
  HealthCheckUpdatePayload,
  HealthCheckWsMessage,
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
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const destroyedRef = useRef(false);

  useEffect(() => {
    let shouldReconnect = true;
    let attempt = 0;

    function scheduleReconnect(): void {
      if (!shouldReconnect || destroyedRef.current) return;
      const delay = Math.min(1000 * 2 ** attempt, 30_000);
      attempt++;
      setStatus("reconnecting");
      reconnectTimer.current = setTimeout(connect, delay);
    }

    function connect(): void {
      if (destroyedRef.current) return;
      setStatus("connecting");

      try {
        wsRef.current = new WebSocket(getWsUrl());
      } catch {
        scheduleReconnect();
        return;
      }

      const ws = wsRef.current;
      ws.onopen = () => {
        attempt = 0;
        setStatus("connected");
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data) as HealthCheckWsMessage;
          if (message.type === "health_check_update") {
            const payload = message.data as HealthCheckUpdatePayload;
            setLatestResults(payload.results);
          }
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (shouldReconnect && !destroyedRef.current) {
          scheduleReconnect();
        } else {
          setStatus("disconnected");
        }
      };
    }

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { status, latestResults };
}
