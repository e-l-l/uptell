from fastapi import WebSocket
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[Dict] = []

    async def connect(self, websocket: WebSocket, org_id: str):
        try:
            await websocket.accept()
            self.active_connections.append({
                "socket": websocket,
                "org_id": org_id
            })
            logger.info(f"WebSocket connection established. Active connections: {len(self.active_connections)}")
        except Exception as e:
            logger.error(f"Failed to accept WebSocket connection: {str(e)}")
            raise

    def disconnect(self, websocket: WebSocket):
        original_count = len(self.active_connections)
        self.active_connections = [
            conn for conn in self.active_connections
            if conn["socket"] != websocket
        ]
        new_count = len(self.active_connections)
        if original_count != new_count:
            logger.info(f"WebSocket disconnected. Active connections: {new_count}")

    async def broadcast(self, message: dict, org_id: str):
        if not self.active_connections:
            logger.debug(f"No active WebSocket connections for broadcast to org_id: {org_id}")
            return
            
        target_connections = [
            conn for conn in self.active_connections 
            if conn["org_id"] == org_id
        ]
        
        if not target_connections:
            logger.debug(f"No WebSocket connections found for org_id: {org_id}")
            return
            
        logger.info(f"Broadcasting message to {len(target_connections)} connections for org_id: {org_id}")
        
        # Keep track of failed connections to remove them
        failed_connections = []
        
        for conn in target_connections:
            try:
                await conn["socket"].send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to WebSocket connection: {str(e)}")
                failed_connections.append(conn["socket"])
        
        # Remove failed connections
        for failed_socket in failed_connections:
            self.disconnect(failed_socket)

# Create a singleton instance
manager = ConnectionManager()