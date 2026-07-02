import type {
  HealthCheckResult,
  HealthCheckStreamDeltaPayload,
  HealthCheckStreamStartedPayload,
  HealthCheckStreamTerminalPayload,
} from "@lite-llm/contracts/ws-events";
import { useCallback, useEffect, useRef, useState } from "react";
import { WsClient } from "@/shared/lib/api-client/ws-client";
import type { ConnectionState, WsMessage } from "@/shared/types/connection";
import type { HealthCheckResultEntry } from "../types/health-status-types";
import { isNewerHealthCheckEntry } from "../utils/health-status-utils";

const WS_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/monitor`
    : "";

export interface RunningHealthCheckExecution {
  executionId: string;
  modelName: string;
  prompt: string;
  startedAt: number;
}

function resultToEntry(result: HealthCheckResult): HealthCheckResultEntry {
  return {
    id: result.id,
    modelName: result.modelName,
    status: result.status,
    responseTimeMs: result.responseTimeMs,
    ttftMs: result.ttftMs,
    outputTokens: result.outputTokens,
    tokensPerSecond: result.tokensPerSecond,
    statusCode: result.statusCode,
    promptSent: result.promptSent,
    responseReceived: result.responseReceived,
    requestPayload: result.requestPayload,
    responsePayload: result.responsePayload,
    errorMessage: result.errorMessage,
    source: result.source,
    checkedAt: result.checkedAt,
  };
}

function mergeLatestResult(
  prev: HealthCheckResultEntry[],
  entry: HealthCheckResultEntry,
): HealthCheckResultEntry[] {
  const byModel = new Map(prev.map((item) => [item.modelName, item]));
  const existing = byModel.get(entry.modelName);
  if (!existing || isNewerHealthCheckEntry(entry, existing)) {
    byModel.set(entry.modelName, entry);
  }
  return [...byModel.values()];
}

export function useHealthStatusWebSocket() {
  const wsRef = useRef<WsClient | null>(null);
  const [status, setStatus] = useState<ConnectionState>("disconnected");
  const [latestResults, setLatestResults] = useState<HealthCheckResultEntry[]>(
    [],
  );
  const [rejectedMap, setRejectedMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [runningExecutions, setRunningExecutions] = useState<
    Map<string, RunningHealthCheckExecution>
  >(new Map());
  const [partialMessages, setPartialMessages] = useState<Map<string, string>>(
    new Map(),
  );

  useEffect(() => {
    if (!WS_URL) return;

    const ws = new WsClient(WS_URL);
    wsRef.current = ws;

    const handleStreamStarted = (payload: HealthCheckStreamStartedPayload) => {
      setRunningExecutions((prev) => {
        const next = new Map(prev);
        next.set(payload.modelName, {
          executionId: payload.executionId,
          modelName: payload.modelName,
          prompt: payload.prompt,
          startedAt: payload.timestamp,
        });
        return next;
      });
      setPartialMessages((prev) => {
        const next = new Map(prev);
        next.set(payload.executionId, "");
        return next;
      });
    };

    const handleStreamDelta = (payload: HealthCheckStreamDeltaPayload) => {
      setPartialMessages((prev) => {
        const next = new Map(prev);
        const current = next.get(payload.executionId) ?? "";
        next.set(payload.executionId, `${current}${payload.delta}`);
        return next;
      });
    };

    const handleStreamTerminal = (
      payload: HealthCheckStreamTerminalPayload,
    ) => {
      const entry = resultToEntry(payload.result);
      setLatestResults((prev) => mergeLatestResult(prev, entry));
      setRunningExecutions((prev) => {
        const next = new Map(prev);
        next.delete(payload.modelName);
        return next;
      });
      setPartialMessages((prev) => {
        const next = new Map(prev);
        next.delete(payload.executionId);
        return next;
      });
    };

    const onMessage = (message: WsMessage) => {
      if (message.type === "health_check_update") {
        const payload = message.data as {
          results: HealthCheckResultEntry[];
          timestamp: number;
        };
        setLatestResults((prev) => {
          const byModel = new Map(
            prev.map((entry) => [entry.modelName, entry]),
          );
          for (const entry of payload.results) {
            const existing = byModel.get(entry.modelName);
            if (!existing || isNewerHealthCheckEntry(entry, existing)) {
              byModel.set(entry.modelName, entry);
            }
          }
          return [...byModel.values()];
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
      } else if (message.type === "health_check_stream_started") {
        handleStreamStarted(message.data as HealthCheckStreamStartedPayload);
      } else if (message.type === "health_check_stream_delta") {
        handleStreamDelta(message.data as HealthCheckStreamDeltaPayload);
      } else if (
        message.type === "health_check_stream_completed" ||
        message.type === "health_check_stream_failed"
      ) {
        handleStreamTerminal(message.data as HealthCheckStreamTerminalPayload);
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

  return {
    status,
    latestResults,
    rejectedMap,
    runningExecutions,
    partialMessages,
    send,
  };
}
