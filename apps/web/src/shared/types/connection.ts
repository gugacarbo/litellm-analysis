export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export interface WsMessage {
  type: "alert" | "health_update" | "connected" | "health_check_update";
  data: unknown;
}
