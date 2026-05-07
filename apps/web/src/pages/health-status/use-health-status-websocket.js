import { useEffect, useRef, useState } from "react";

function getWsUrl() {
  if (import.meta.env.PROD) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws/monitor`;
  }
  return `ws://${window.location.hostname}:5178/ws/monitor`;
}
export function useHealthStatusWebSocket() {
  const [status, setStatus] = useState("disconnected");
  const [latestResults, setLatestResults] = useState(null);
  const reconnectTimer = useRef(null);
  const wsRef = useRef(null);
  const destroyedRef = useRef(false);
  useEffect(() => {
    let shouldReconnect = true;
    let attempt = 0;
    function scheduleReconnect() {
      if (!shouldReconnect || destroyedRef.current) return;
      const delay = Math.min(1000 * 2 ** attempt, 30_000);
      attempt++;
      setStatus("reconnecting");
      reconnectTimer.current = setTimeout(connect, delay);
    }
    function connect() {
      if (destroyedRef.current) return;
      setStatus("connecting");
      try {
        wsRef.current = new WebSocket(getWsUrl());
      } catch {
        scheduleReconnect();
        return;
      }
      const ws = wsRef.current;
      ws.onopen = () => {
        attempt = 0;
        setStatus("connected");
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "health_check_update") {
            const payload = message.data;
            setLatestResults(payload.results);
          }
        } catch {}
      };
      ws.onclose = () => {
        wsRef.current = null;
        if (shouldReconnect && !destroyedRef.current) {
          scheduleReconnect();
        } else {
          setStatus("disconnected");
        }
      };
    }
    connect();
    return () => {
      shouldReconnect = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);
  return { status, latestResults };
}
