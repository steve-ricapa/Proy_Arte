from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AnalyzeProfileRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=30)
    posts_limit: int = Field(default=12, ge=3, le=30)


class AnalyzeProfileResponse(BaseModel):
    process_id: str


class PipelineEvent(BaseModel):
    step: str
    progress: int
    message: str
    image: str | None = None
    data: dict[str, Any] | None = None
