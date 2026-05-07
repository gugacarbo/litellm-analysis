import { WebSocket, WebSocketServer as WsServer } from "ws";

const WS_PATH = "/ws/monitor";
const HEARTBEAT_INTERVAL = 30_000;
const PONG_TIMEOUT = 30_000;
export class WebSocketServer {
  httpServer;
  wss = null;
  clients = new Set();
  heartbeatTimer = null;
  started = false;
  constructor(httpServer) {
    this.httpServer = httpServer;
  }
  start() {
    if (this.started) {
      return;
    }
    this.wss = new WsServer({ noServer: true, path: WS_PATH });
    this.wss.on("connection", (ws) => {
      const tracked = { ws, isAlive: true, pongTimer: null };
      this.clients.add(tracked);
      const connectedMessage = {
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
      const deadClients = [];
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
  broadcast(message) {
    const json = JSON.stringify(message);
    const deadClients = [];
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
  getConnectionCount() {
    return this.clients.size;
  }
  stop() {
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
