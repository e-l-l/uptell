let socket: WebSocket | null = null;

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export function connectWebSocket(
  org_id: string,
  onMessage: (data: any) => void
) {
  // Close existing connection if any
  if (socket) {
    socket.close();
  }

  socket = new WebSocket(`${WS_BASE}?org_id=${org_id}`);

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return () => {
    if (socket) {
      socket.close();
      socket = null;
    }
  };
}
