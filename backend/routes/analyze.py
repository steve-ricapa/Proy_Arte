from __future__ import annotations

from fastapi import APIRouter

from models.schemas import AnalyzeProfileRequest, AnalyzeProfileResponse
from services.pipeline_service import PipelineService


def get_analyze_router(pipeline_service: PipelineService) -> APIRouter:
    router = APIRouter()

    @router.post("/analyze-profile", response_model=AnalyzeProfileResponse)
    async def analyze_profile(payload: AnalyzeProfileRequest) -> AnalyzeProfileResponse:
        process_id = pipeline_service.start_profile_analysis(
            username=payload.username.strip(),
            posts_limit=payload.posts_limit,
        )
        return AnalyzeProfileResponse(process_id=process_id)

    return router
