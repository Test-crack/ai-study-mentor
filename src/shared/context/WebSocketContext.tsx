import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

type ConnectionStatus = 'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR';

interface WebSocketContextType {
    socket: WebSocket | null;
    status: ConnectionStatus;
    sendMessage: (data: string | ArrayBuffer | Blob) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile } = useAuth();
    const [status, setStatus] = useState<ConnectionStatus>('CLOSED');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = () => {
        if (!profile) return;
        
        // Prevent redundant connections if already open or connecting
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            console.log("🌐 WebSocket: Connection already exists or is connecting, skipping...");
            return;
        }

        const baseUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
        const urlWithParams = new URL(baseUrl);
        urlWithParams.searchParams.append('userId', profile.id);
        urlWithParams.searchParams.append('username', profile.name || 'Anonymous');
        urlWithParams.searchParams.append('role', profile.role);

        console.log(`🌐 WebSocket: Connecting for ${profile.name}...`);
        setStatus('CONNECTING');

        const ws = new WebSocket(urlWithParams.toString());
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("🟢 WebSocket: Connected");
            setStatus('OPEN');
        };

        ws.onclose = () => {
            console.log("🔴 WebSocket: Closed");
            setStatus('CLOSED');
            // Try to reconnect if profile still exists
            if (profile) {
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error("❌ WebSocket: Error", error);
            setStatus('ERROR');
        };
    };

    useEffect(() => {
        if (profile) {
            connect();
        } else {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            setStatus('CLOSED');
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [profile?.id]);

    const sendMessage = (data: string | ArrayBuffer | Blob) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
        } else {
            console.warn("⚠️ WebSocket: Cannot send message, socket not open");
        }
    };

    return (
        <WebSocketContext.Provider value={{ socket: wsRef.current, status, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
