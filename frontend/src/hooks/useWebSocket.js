// src/hooks/useWebSocket.js
// Manages the live WebSocket connection to the Go backend.
// Exposes the latest message and connection status to consumers.

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECTS = 8;

/**
 * useWebSocket
 * @returns {{ message: object|null, status: 'connecting'|'open'|'closed'|'error' }}
 */
export function useWebSocket() {
  const [message, setMessage]   = useState(null);
  const [status, setStatus]     = useState('connecting');
  const wsRef                   = useRef(null);
  const reconnectCount          = useRef(0);
  const reconnectTimer          = useRef(null);
  const mountedRef              = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setStatus('connecting');

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('🔗  WebSocket connected');
        setStatus('open');
        reconnectCount.current = 0;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          setMessage(data);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WS error:', err);
        if (mountedRef.current) setStatus('error');
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus('closed');
        if (reconnectCount.current < MAX_RECONNECTS) {
          reconnectCount.current += 1;
          console.log(`🔄  Reconnecting… (${reconnectCount.current}/${MAX_RECONNECTS})`);
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    } catch (err) {
      console.error('WS creation error:', err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { message, status };
}
