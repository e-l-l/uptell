from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[Dict] = []

    async def connect(self, websocket: WebSocket, org_id: str):
        await websocket.accept()
        self.active_connections.append({
            "socket": websocket,
            "org_id": org_id
        })

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [
            conn for conn in self.active_connections
            if conn["socket"] != websocket
        ]

    async def broadcast(self, message: dict, org_id: str):
        for conn in self.active_connections:
            if conn["org_id"] == org_id:
                await conn["socket"].send_json(message)

# Create a singleton instance
manager = ConnectionManager()