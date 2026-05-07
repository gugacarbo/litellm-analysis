export class WsClient {
  ws = null;
  url;
  messageCallbacks = new Set();
  statusCallbacks = new Set();
  reconnectTimer = null;
  reconnectAttempt = 0;
  maxReconnectDelay = 30_000;
  shouldReconnect = false;
  destroyed = false;
  constructor(url) {
    this.url = url;
  }
  connect() {
    if (this.destroyed) return;
    this.shouldReconnect = true;
    this.reconnectAttempt = 0;
    this.doConnect();
  }
  doConnect() {
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
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
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
  disconnect() {
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
  destroy() {
    this.destroyed = true;
    this.disconnect();
    this.messageCallbacks.clear();
    this.statusCallbacks.clear();
  }
  onMessage(callback) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }
  onStatusChange(callback) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }
  getStatus() {
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
  scheduleReconnect() {
    if (this.destroyed || !this.shouldReconnect) return;
    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempt,
      this.maxReconnectDelay,
    );
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.doConnect(), delay);
  }
  emitStatus(status) {
    for (const cb of this.statusCallbacks) {
      cb(status);
    }
  }
}
