import asyncio
from fastapi import WebSocket
from typing import List
from collections import deque
import copy
from models import VenueSnapshot


class VenueState:
    def __init__(self):
        self.snapshot: VenueSnapshot | None = None
        self.history = deque(
            maxlen=60
        )  # Keep last 60 readings (~5 mins if 5s intervals)
        self.active_connections: List[WebSocket] = []
        self.lock = asyncio.Lock()

    async def record_history(self):
        if self.snapshot:
            # We copy the relevant mutable state we want to track (just densities for gates/zones/sensors)
            # A deepcopy is easiest for simplicity in this demo.
            snapshot_copy = copy.deepcopy(self.snapshot)
            self.history.append(snapshot_copy)

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self.lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)

    async def broadcast(self):
        if not self.snapshot:
            return

        # Serialize the state
        data = self.snapshot.model_dump_json()

        # We need a copy of connections to avoid issues if a disconnect happens during broadcast
        async with self.lock:
            connections = list(self.active_connections)

        for connection in connections:
            try:
                await connection.send_text(data)
            except Exception:
                # If sending fails, we can assume the connection is dead
                await self.disconnect(connection)


# Global singleton state
venue_state = VenueState()
