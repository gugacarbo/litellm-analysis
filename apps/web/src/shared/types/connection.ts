export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

type WsMessageType =
  | "alert"
  | "health_update"
  | "connected"
  | "health_check_update"
  | "request_health_check"
  | "health_check_rejected"
  | import("@lite-llm/contracts/ws-events").AutomaticInteractionWsEventType;

export interface WsMessage {
  type: WsMessageType;
  data: unknown;
}
