import type { AutomaticInteractionWsEventType } from "@lite-llm/contracts/ws-events";

export type { AutomaticInteractionWsEventType } from "@lite-llm/contracts/ws-events";

export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export type WsMessageType =
  | "alert"
  | "health_update"
  | "connected"
  | "health_check_update"
  | "request_health_check"
  | "health_check_rejected"
  | "prompt_eval_run_update"
  | "prompt_eval_run_completed"
  | AutomaticInteractionWsEventType;

export interface WsMessage {
  type: WsMessageType;
  data: unknown;
}
