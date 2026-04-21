// src/lib/websocket.ts
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;
const listeners: ((data: any) => void)[] = [];

export function connectWebSocket(token: string) {
  if (stompClient?.connected) return;

  // Récupérer l'URL du backend depuis les variables d'environnement
  const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
  const socketUrl = API_BASE_URL.replace('/api', '/ws');

  const socket = new SockJS(socketUrl);
  stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: (str) => {
      // console.log(str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = (frame) => {
    console.log('WebSocket Connecté (STOMP)');
    
    // S'abonner aux notifications personnelles
    // Le backend doit envoyer à /user/queue/notifications
    stompClient?.subscribe('/user/queue/notifications', (message) => {
      if (message.body) {
        const data = JSON.parse(message.body);
        listeners.forEach(callback => callback(data));
      }
    });
  };

  stompClient.onStompError = (frame) => {
    console.error('Erreur STOMP:', frame.headers['message']);
    console.error('Détails:', frame.body);
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
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    console.log("WebSocket Déconnecté");
  }
}
