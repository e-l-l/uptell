let socket: WebSocket | null = null;

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
export function connectWebSocket(
  org_id: string,
  onMessage: (data: any) => void
) {
  socket = new WebSocket(`${WS_BASE}?org_id=${org_id}`);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };
}
