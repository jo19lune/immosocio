// src/lib/websocket.ts
let socket: WebSocket | null = null;

export function connectWebSocket(url: string) {
  socket = new WebSocket(url);
  socket.onopen = () => console.log("WebSocket connecté");
}

export function onNotification(callback: (msg: string) => void) {
  if (!socket) return;
  socket.onmessage = (event) => callback(event.data);
}

export function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
    console.log("WebSocket déconnecté");
  }
}
