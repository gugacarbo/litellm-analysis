import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer as WsServer } from "ws";

export type MessageType = "alert" | "health_update" | "connected";

export interface WsMessage {
  type: MessageType;
  data: unknown;
}

const WS_PATH = "/ws/monitor";
const HEARTBEAT_INTERVAL = 30_000;
const PONG_TIMEOUT = 30_000;

interface TrackedWebSocket {
  ws: WebSocket;
  isAlive: boolean;
}

export class WebSocketServer {
  private readonly httpServer: HttpServer;
  private wss: WsServer | null = null;
  private clients: Set<TrackedWebSocket> = new Set();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;

  constructor(httpServer: HttpServer) {
    this.httpServer = httpServer;
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.wss = new WsServer({ noServer: true, path: WS_PATH });

    this.wss.on("connection", (ws: WebSocket) => {
      const tracked: TrackedWebSocket = { ws, isAlive: true };
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
        this.clients.delete(tracked);
      });

      ws.on("error", () => {
        this.clients.delete(tracked);
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

          setTimeout(() => {
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

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.started = false;
  }
}
