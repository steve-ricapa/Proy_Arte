from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AnalyzeProfileRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=120)
    limit: int = Field(default=12, ge=1, le=50)

    @property
    def posts_limit(self) -> int:
        return self.limit


class AnalyzeProfileResponse(BaseModel):
    source: str
    status: str
    username: str
    generated_at: str
    profile: dict[str, Any]
    metadata: dict[str, Any]
    metrics: dict[str, Any]
    analysis: dict[str, Any]
    posts: list[dict[str, Any]]
    render_hints: dict[str, Any]


class PipelineEvent(BaseModel):
    step: str
    progress: int
    message: str
    image: str | None = None
    data: dict[str, Any] | None = None
