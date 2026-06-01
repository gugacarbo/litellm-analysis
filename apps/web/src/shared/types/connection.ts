export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export interface WsMessage {
  type:
    | "alert"
    | "health_update"
    | "connected"
    | "health_check_update"
    | "request_health_check"
    | "health_check_rejected"
    | "prompt_eval_run_update"
    | "prompt_eval_run_completed";
  data: unknown;
}
