from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from websocket.connection_manager import ConnectionManager


def get_websocket_router(manager: ConnectionManager) -> APIRouter:
    router = APIRouter()

    @router.websocket("/ws/{process_id}")
    async def websocket_endpoint(websocket: WebSocket, process_id: str) -> None:
        await manager.connect(process_id, websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await manager.disconnect(process_id, websocket)
        except Exception:
            await manager.disconnect(process_id, websocket)

    return router
