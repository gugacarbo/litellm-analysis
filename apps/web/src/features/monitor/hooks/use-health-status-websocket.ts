import { useCallback, useEffect, useRef, useState } from "react";
import { WsClient } from "@/shared/lib/api-client/ws-client";
import type { ConnectionState, WsMessage } from "@/shared/types/connection";
import type { HealthCheckResultEntry } from "../types/health-status-types";

const WS_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/monitor`
    : "";

export function useHealthStatusWebSocket() {
  const wsRef = useRef<WsClient | null>(null);
  const [status, setStatus] = useState<ConnectionState>("disconnected");
  const [latestResults, setLatestResults] = useState<HealthCheckResultEntry[]>(
    [],
  );
  const [rejectedMap, setRejectedMap] = useState<Map<string, string>>(
    new Map(),
  );

  useEffect(() => {
    if (!WS_URL) return;

    const ws = new WsClient(WS_URL);
    wsRef.current = ws;

    const onMessage = (message: WsMessage) => {
      if (message.type === "health_check_update") {
        const payload = message.data as {
          results: HealthCheckResultEntry[];
          timestamp: number;
        };
        setLatestResults((prev) => {
          const updated = prev.filter(
            (r) => !payload.results.some((nr) => nr.modelName === r.modelName),
          );
          return [...payload.results, ...updated];
        });
      } else if (message.type === "health_check_rejected") {
        const payload = message.data as {
          modelName: string;
          reason: string;
        };
        setRejectedMap((prev) => {
          const next = new Map(prev);
          next.set(payload.modelName, payload.reason);
          return next;
        });
      }
    };

    const onStatus = (newStatus: ConnectionState) => {
      setStatus(newStatus);
    };

    const unsubMessage = ws.onMessage(onMessage);
    const unsubStatus = ws.onStatusChange(onStatus);
    ws.connect();

    return () => {
      unsubMessage();
      unsubStatus();
      ws.disconnect();
    };
  }, []);

  const send = useCallback((msg: object) => {
    wsRef.current?.send(msg);
  }, []);

  return { status, latestResults, rejectedMap, send };
}
