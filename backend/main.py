from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

from routes.analyze import get_analyze_router
from services.pipeline_service import PipelineService


app = FastAPI(title="Instagram Artistic Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline_service = PipelineService()

app.include_router(get_analyze_router(pipeline_service), tags=["analyze"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/auth-status")
async def auth_status() -> dict[str, object]:
    return pipeline_service.get_auth_status()


@app.get("/extractor-status")
async def extractor_status() -> dict[str, object]:
    return pipeline_service.get_extractor_status()
