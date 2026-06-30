import type { SpendLogsChangedPayload } from "@lite-llm/contracts/ws-events";
import { useEffect, useRef, useState } from "react";
import { WsClient } from "@/shared/lib/api-client/ws-client";
import type { ConnectionState, WsMessage } from "@/shared/types/connection";

function getWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/monitor`;
}

export interface UseSpendLogsWsOptions {
  enabled?: boolean;
  onSpendLogsChanged: (payload: SpendLogsChangedPayload) => void;
}

export function useSpendLogsWs({
  enabled = true,
  onSpendLogsChanged,
}: UseSpendLogsWsOptions) {
  const [status, setStatus] = useState<ConnectionState>("disconnected");
  const handlerRef = useRef(onSpendLogsChanged);
  handlerRef.current = onSpendLogsChanged;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const client = new WsClient(getWsUrl());
    const unsubMessage = client.onMessage((message: WsMessage) => {
      if (message.type === "spend_logs_changed") {
        handlerRef.current(message.data as SpendLogsChangedPayload);
      }
    });
    const unsubStatus = client.onStatusChange(setStatus);
    client.connect();

    return () => {
      unsubMessage();
      unsubStatus();
      client.disconnect();
    };
  }, [enabled]);

  return { status };
}
