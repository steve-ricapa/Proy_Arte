from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.analyze import get_analyze_router
from services.pipeline_service import PipelineService
from websocket.connection_manager import ConnectionManager
from websocket.ws_routes import get_websocket_router


app = FastAPI(title="Instagram Artistic Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()
pipeline_service = PipelineService(manager=manager)

app.include_router(get_analyze_router(pipeline_service), tags=["analyze"])
app.include_router(get_websocket_router(manager), tags=["websocket"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
