let socket: WebSocket | null = null;
let isConnecting = false;

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
const HTTP_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Test if the backend server is accessible
async function testServerConnectivity(): Promise<boolean> {
  try {
    const response = await fetch(`${HTTP_BASE}/docs`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.status < 500; // Accept any response that's not a server error
  } catch (error) {
    console.error("Backend server connectivity test failed:", error);
    return false;
  }
}

export function connectWebSocket(
  org_id: string,
  onMessage: (data: any) => void
) {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    return () => {};
  }

  // Validate org_id
  if (!org_id) {
    return () => {};
  }

  // Close existing connection if any
  if (socket) {
    socket.close();
    socket = null;
  }

  async function connect() {
    isConnecting = true;

    // Test server connectivity first
    const serverAccessible = await testServerConnectivity();
    if (!serverAccessible) {
      console.error(
        "WebSocket: Backend server is not accessible. Is the backend running?"
      );
      console.error(`WebSocket: Trying to reach: ${HTTP_BASE}/docs`);
      console.error(
        "WebSocket: Backend server appears to be down. Please start the backend server and refresh the page."
      );
      isConnecting = false;
      return;
    }

    try {
      socket = new WebSocket(`${WS_BASE}?org_id=${org_id}`);

      socket.onopen = () => {
        isConnecting = false;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error("WebSocket: Error parsing message:", error);
        }
      };

      socket.onclose = (event) => {
        isConnecting = false;
        socket = null;

        // Provide helpful error messages based on close codes
        if (event.code === 1008) {
          console.error(
            "WebSocket: Connection rejected - missing or invalid org_id"
          );
        } else if (event.code === 1011) {
          console.error("WebSocket: Server error occurred");
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        isConnecting = false;

        if (socket) {
          socket.close();
        }
      };
    } catch (error) {
      console.error("WebSocket: Failed to create connection:", error);
      isConnecting = false;
    }
  }

  // Start the connection
  connect();

  // Return cleanup function
  return () => {
    if (socket) {
      // Clean close to prevent reconnection
      socket.close(1000, "Component unmounted");
      socket = null;
    }

    isConnecting = false;
  };
}
