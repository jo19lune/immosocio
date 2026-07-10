// src/lib/websocket.ts
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;
const listeners: ((data: any) => void)[] = [];
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // 30s max

export function connectWebSocket(token: string) {
  // Avoid double connections
  if (stompClient?.active) return;

  const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
  const socketUrl = API_BASE_URL.replace('/api', '/ws');

  stompClient = new Client({
    // Use a factory so SockJS is re-created on reconnect
    webSocketFactory: () => new SockJS(socketUrl),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    debug: () => {
      // Silent in production
    },
    // Exponential back-off: start at 5s, cap at 30s
    reconnectDelay: Math.min(5000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY),
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  stompClient.onConnect = (_frame) => {
    reconnectAttempts = 0;
    console.log('[WS] Connecté');

    stompClient?.subscribe('/user/queue/notifications', (message) => {
      if (message.body) {
        try {
          const data = JSON.parse(message.body);
          listeners.forEach((cb) => cb(data));
        } catch {
          // ignore malformed frames
        }
      }
    });
  };

  stompClient.onDisconnect = () => {
    console.log('[WS] Déconnecté');
  };

  stompClient.onStompError = (frame) => {
    reconnectAttempts++;
    console.warn('[WS] Erreur STOMP:', frame.headers['message']);
  };

  stompClient.onWebSocketError = (_event) => {
    reconnectAttempts++;
    console.warn('[WS] Erreur WebSocket (tentative', reconnectAttempts, ')');
  };

  stompClient.activate();
}

export function onNotification(callback: (data: any) => void) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

export function disconnectWebSocket() {
  if (stompClient?.active) {
    stompClient.deactivate();
  }
  stompClient = null;
  reconnectAttempts = 0;
}
