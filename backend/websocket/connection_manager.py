from __future__ import annotations

import asyncio
from collections import defaultdict

from fastapi import WebSocket

from models.schemas import PipelineEvent


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._event_history: dict[str, list[PipelineEvent]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def connect(self, process_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[process_id].add(websocket)
            history = list(self._event_history.get(process_id, []))
        for event in history:
            await websocket.send_json(event.model_dump())

    async def disconnect(self, process_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if process_id in self._connections:
                self._connections[process_id].discard(websocket)
                if not self._connections[process_id]:
                    self._connections.pop(process_id, None)

    async def broadcast(self, process_id: str, event: PipelineEvent) -> None:
        async with self._lock:
            self._event_history[process_id].append(event)
            sockets = list(self._connections.get(process_id, []))

        disconnected: list[WebSocket] = []
        for socket in sockets:
            try:
                await socket.send_json(event.model_dump())
            except Exception:
                disconnected.append(socket)

        if disconnected:
            async with self._lock:
                if process_id in self._connections:
                    for socket in disconnected:
                        self._connections[process_id].discard(socket)

    async def cleanup(self, process_id: str) -> None:
        async with self._lock:
            self._event_history.pop(process_id, None)
