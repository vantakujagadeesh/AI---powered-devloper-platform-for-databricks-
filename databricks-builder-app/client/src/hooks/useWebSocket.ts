import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (e: Event) => void;
  reconnect?: boolean;
  reconnectDelay?: number;
}

export function useWebSocket(url: string | null, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectDelay = 3000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!url || !mountedRef.current) return;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setReadyState(WebSocket.CONNECTING);

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setReadyState(WebSocket.OPEN);
      onOpen?.();
    };
    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        onMessage?.(JSON.parse(e.data));
      } catch {
        onMessage?.(e.data);
      }
    };
    ws.onclose = () => {
      if (!mountedRef.current) return;
      setReadyState(WebSocket.CLOSED);
      onClose?.();
      if (reconnect) {
        reconnectTimer.current = setTimeout(connect, reconnectDelay);
      }
    };
    ws.onerror = (e) => {
      onError?.(e);
    };
  }, [url, onMessage, onOpen, onClose, onError, reconnect, reconnectDelay]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
  }, []);

  return {
    send,
    disconnect,
    readyState,
    isConnected: readyState === WebSocket.OPEN,
    isConnecting: readyState === WebSocket.CONNECTING,
  };
}
