from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from models.schemas import AnalyzeProfileRequest, AnalyzeProfileResponse
from services.apify_instagram_service import ApifyServiceError, clean_instagram_username
from services.pipeline_service import PipelineService


logger = logging.getLogger(__name__)


def get_analyze_router(pipeline_service: PipelineService) -> APIRouter:
    router = APIRouter()

    @router.post("/analyze-profile", response_model=AnalyzeProfileResponse)
    async def analyze_profile(payload: AnalyzeProfileRequest) -> AnalyzeProfileResponse:
        logger.info("analyze.request.start username_input=%s limit=%s", payload.username, payload.posts_limit)
        try:
            username = clean_instagram_username(payload.username)
        except ValueError as exc:
            logger.warning("analyze.request.invalid_username username_input=%s detail=%s", payload.username, exc)
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        auth = pipeline_service.get_auth_status()
        if auth.get("status") == "failed" and "APIFY_TOKEN" in auth.get("note", ""):
            logger.error("analyze.request.missing_token username=%s", username)
            raise HTTPException(status_code=500, detail="APIFY_TOKEN no esta configurado en el backend.")

        try:
            result = await pipeline_service.analyze_profile(username=username, posts_limit=payload.posts_limit)
            logger.info(
                "analyze.request.success username=%s limit=%s posts=%s",
                username,
                payload.posts_limit,
                len(result.get("posts", [])),
            )
            return AnalyzeProfileResponse(**result)
        except ValueError as exc:
            logger.warning("analyze.request.not_found username=%s detail=%s", username, exc)
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ApifyServiceError as exc:
            logger.error(
                "analyze.request.apify_error username=%s limit=%s type=%s status=%s detail=%s",
                username,
                payload.posts_limit,
                exc.error_type,
                exc.status_code,
                exc,
            )
            if exc.error_type == "missing_token":
                raise HTTPException(status_code=500, detail="APIFY_TOKEN no esta configurado en el backend.") from exc
            if exc.error_type == "auth":
                raise HTTPException(status_code=502, detail="Apify token invalido o sin permisos.") from exc
            if exc.error_type == "timeout":
                raise HTTPException(status_code=504, detail="La extraccion tardo demasiado. Intenta con menos posts.") from exc
            raise HTTPException(status_code=502, detail="Error consultando Apify.") from exc
        except RuntimeError as exc:
            logger.exception("analyze.request.runtime_error username=%s limit=%s", username, payload.posts_limit)
            detail = str(exc)
            if "token" in detail.lower():
                raise HTTPException(status_code=502, detail="Apify token invalido o sin permisos.") from exc
            if "timeout" in detail.lower() or "tardo demasiado" in detail.lower():
                raise HTTPException(status_code=504, detail="La extraccion tardo demasiado. Intenta con menos posts.") from exc
            raise HTTPException(status_code=502, detail="Error consultando Apify.") from exc

    return router
