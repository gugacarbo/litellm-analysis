import type { ConnectionState, WsMessage } from "@/shared/types/connection";

type MessageCallback = (message: WsMessage) => void;
type StatusCallback = (status: ConnectionState) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private maxReconnectDelay = 30_000;
  private shouldReconnect = false;
  private destroyed = false;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.destroyed) return;
    this.shouldReconnect = true;
    this.reconnectAttempt = 0;
    this.doConnect();
  }

  private doConnect(): void {
    if (this.destroyed) return;
    this.emitStatus("connecting");

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    const ws = this.ws;

    ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.emitStatus("connected");
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        for (const cb of this.messageCallbacks) {
          cb(message);
        }
      } catch {
        // Ignore invalid JSON messages
      }
    };

    ws.onclose = () => {
      this.ws = null;
      if (this.shouldReconnect && !this.destroyed) {
        this.emitStatus("reconnecting");
        this.scheduleReconnect();
      } else {
        this.emitStatus("disconnected");
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emitStatus("disconnected");
  }

  destroy(): void {
    this.destroyed = true;
    this.disconnect();
    this.messageCallbacks.clear();
    this.statusCallbacks.clear();
  }

  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  getStatus(): ConnectionState {
    if (
      !this.ws ||
      this.ws.readyState === WebSocket.CLOSED ||
      this.ws.readyState === WebSocket.CLOSING
    ) {
      return this.shouldReconnect ? "reconnecting" : "disconnected";
    }
    if (this.ws.readyState === WebSocket.CONNECTING) return "connecting";
    return "connected";
  }

  private scheduleReconnect(): void {
    if (this.destroyed || !this.shouldReconnect) return;
    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempt,
      this.maxReconnectDelay,
    );
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.doConnect(), delay);
  }

  private emitStatus(status: ConnectionState): void {
    for (const cb of this.statusCallbacks) {
      cb(status);
    }
  }
}

