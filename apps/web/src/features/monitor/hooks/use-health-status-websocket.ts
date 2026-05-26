import { useEffect, useRef, useState } from "react";
import { WsClient } from "@/shared/lib/api-client/ws-client";
import type { ConnectionState, WsMessage } from "@/shared/types/connection";
import type { HealthCheckResultEntry } from "../types/health-status-types";

const WS_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`
    : "";

export function useHealthStatusWebSocket() {
  const wsRef = useRef<WsClient | null>(null);
  const [status, setStatus] = useState<ConnectionState>("disconnected");
  const [latestResults, setLatestResults] = useState<HealthCheckResultEntry[]>(
    [],
  );

  useEffect(() => {
    if (!WS_URL) return;

    const ws = new WsClient(WS_URL);
    wsRef.current = ws;

    const onMessage = (message: WsMessage) => {
      if (message.type === "health_check_update") {
        const result = message.data as HealthCheckResultEntry;
        setLatestResults((prev) => {
          const filtered = prev.filter((r) => r.modelName !== result.modelName);
          return [result, ...filtered];
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

  return { status, latestResults };
}
