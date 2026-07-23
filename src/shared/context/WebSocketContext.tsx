// src/shared/context/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

type ConnectionStatus = 'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR';

interface WebSocketContextType {
  socket: WebSocket | null;
  status: ConnectionStatus;
  sendMessage: (data: string | ArrayBuffer | Blob) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const MAX_RETRIES = 8;
const BASE_DELAY = 1000;
const MAX_DELAY = 30_000;

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('CLOSED');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const profileRef = useRef(profile);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearReconnectTimer();
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [clearReconnectTimer]);

  const connect = useCallback(() => {
    const p = profileRef.current;
    if (!p) return;

    if (!navigator.onLine) {
      console.log('🌐 WS: Offline — waiting for network…');
      setStatus('CLOSED');
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (retryCountRef.current >= MAX_RETRIES) {
      console.log(`🌐 WS: Gave up after ${MAX_RETRIES} attempts`);
      setStatus('CLOSED');
      return;
    }

    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    const url = new URL(baseUrl);
    url.searchParams.append('userId', p.id);
    url.searchParams.append('username', p.name || 'Anonymous');
    url.searchParams.append('role', p.role);

    console.log(`🌐 WS: Connecting for ${p.name}…`);
    setStatus('CONNECTING');

    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🟢 WS: Connected');
      setStatus('OPEN');
      retryCountRef.current = 0;
    };

    ws.onclose = () => {
      console.log('🔴 WS: Closed');
      setStatus('CLOSED');
      wsRef.current = null;

      if (!profileRef.current || !navigator.onLine) return;

      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * Math.pow(2, retryCountRef.current), MAX_DELAY);
        retryCountRef.current += 1;
        console.log(`🌐 WS: Retry ${retryCountRef.current}/${MAX_RETRIES} in ${(delay / 1000).toFixed(1)}s`);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (err) => {
      console.error('❌ WS: Error', err);
      setStatus('ERROR');
    };
  }, []);

  // Connect / disconnect on profile change
  useEffect(() => {
    if (profile) {
      retryCountRef.current = 0;
      connect();
    } else {
      cleanup();
      setStatus('CLOSED');
    }
    return cleanup;
  }, [profile?.id, connect, cleanup]);

  // Network-aware reconnect
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 WS: Network restored — reconnecting');
      retryCountRef.current = 0;
      connect();
    };
    const handleOffline = () => {
      console.log('🌐 WS: Network lost — pausing reconnect');
      clearReconnectTimer();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect, clearReconnectTimer]);

  const sendMessage = useCallback((data: string | ArrayBuffer | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else {
      console.warn('⚠️ WS: Not connected, message dropped');
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket: wsRef.current, status, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
};