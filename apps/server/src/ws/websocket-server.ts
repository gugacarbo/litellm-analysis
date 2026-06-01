import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer as WsServer } from "ws";

type MessageType =
  | "alert"
  | "health_update"
  | "health_check_update"
  | "connected"
  | "prompt_eval_run_update"
  | "prompt_eval_run_completed"
  | "request_health_check"
  | "health_check_rejected";

interface WsMessage {
  type: MessageType;
  data: unknown;
}

type ClientMessageHandler = (
  ws: WebSocket,
  message: { type: string; data: unknown },
) => void;

const WS_PATH = "/ws/monitor";
const HEARTBEAT_INTERVAL = 30_000;
const PONG_TIMEOUT = 30_000;

interface TrackedWebSocket {
  ws: WebSocket;
  isAlive: boolean;
  pongTimer: ReturnType<typeof setTimeout> | null;
}

export class WebSocketServer {
  private readonly httpServer: HttpServer;
  private wss: WsServer | null = null;
  private clients: Set<TrackedWebSocket> = new Set();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private clientMessageHandlers: Set<ClientMessageHandler> = new Set();

  constructor(httpServer: HttpServer) {
    this.httpServer = httpServer;
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.wss = new WsServer({ noServer: true, path: WS_PATH });

    this.wss.on("connection", (ws: WebSocket) => {
      const tracked: TrackedWebSocket = { ws, isAlive: true, pongTimer: null };
      this.clients.add(tracked);

      const connectedMessage: WsMessage = {
        type: "connected",
        data: { timestamp: Date.now() },
      };
      ws.send(JSON.stringify(connectedMessage));

      ws.on("pong", () => {
        tracked.isAlive = true;
      });

      ws.on("close", () => {
        if (tracked.pongTimer) {
          clearTimeout(tracked.pongTimer);
          tracked.pongTimer = null;
        }
        this.clients.delete(tracked);
      });

      ws.on("error", () => {
        if (tracked.pongTimer) {
          clearTimeout(tracked.pongTimer);
          tracked.pongTimer = null;
        }
        this.clients.delete(tracked);
      });

      ws.on("message", (raw) => {
        let parsed: { type: string; data: unknown };
        try {
          parsed = JSON.parse(raw.toString());
        } catch {
          return;
        }
        for (const handler of this.clientMessageHandlers) {
          try {
            handler(ws, parsed);
          } catch {
            // handler threw — continue with remaining handlers
          }
        }
      });
    });

    this.httpServer.on("upgrade", (request, socket, head) => {
      const url = request.url ?? "";
      const pathname = url.split("?")[0];

      if (pathname === WS_PATH && this.wss) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit("connection", ws, request);
        });
      }
    });

    this.heartbeatTimer = setInterval(() => {
      const deadClients: TrackedWebSocket[] = [];

      this.clients.forEach((tracked) => {
        const { ws } = tracked;
        if (ws.readyState === WebSocket.OPEN) {
          if (!tracked.isAlive) {
            ws.terminate();
            deadClients.push(tracked);
            return;
          }

          tracked.isAlive = false;
          ws.ping();

          if (tracked.pongTimer) {
            clearTimeout(tracked.pongTimer);
          }
          tracked.pongTimer = setTimeout(() => {
            if (!tracked.isAlive && ws.readyState === WebSocket.OPEN) {
              ws.terminate();
              deadClients.push(tracked);
            }
          }, PONG_TIMEOUT);
        }
      });

      deadClients.forEach((tracked) => {
        this.clients.delete(tracked);
      });
    }, HEARTBEAT_INTERVAL);

    this.started = true;
  }

  broadcast(message: object): void {
    const json = JSON.stringify(message);
    const deadClients: TrackedWebSocket[] = [];

    this.clients.forEach((tracked) => {
      const { ws } = tracked;
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(json);
        } catch {
          deadClients.push(tracked);
        }
      } else {
        deadClients.push(tracked);
      }
    });

    deadClients.forEach((tracked) => {
      this.clients.delete(tracked);
    });
  }

  onClientMessage(handler: ClientMessageHandler): void {
    this.clientMessageHandlers.add(handler);
  }

  sendTo(ws: WebSocket, message: object): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch {
        // client disconnected — message dropped
      }
    }
  }

  getConnectionCount(): number {
    return this.clients.size;
  }

  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.clients.forEach((tracked) => {
      tracked.ws.terminate();
    });
    this.clients.clear();
    this.clientMessageHandlers.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.started = false;
  }
}
