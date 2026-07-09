from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import logging
from time import perf_counter
from typing import Any

from services.analysis_service import AnalysisService
from services.instagram_service import InstagramService
from services.mock_analysis_service import build_mock_analysis_payload
from core import config


logger = logging.getLogger(__name__)


class PipelineService:
    def __init__(self) -> None:
        self.instagram = InstagramService()
        self.analysis = AnalysisService()
        self._inflight_lock = asyncio.Lock()
        self._inflight_jobs: dict[str, asyncio.Task[dict[str, Any]]] = {}

    def get_auth_status(self) -> dict[str, Any]:
        return self.instagram.get_auth_status()

    def get_extractor_status(self) -> dict[str, Any]:
        return {"auth": self.instagram.get_auth_status()}

    @staticmethod
    def _build_job_key(username: str, posts_limit: int) -> str:
        return f"{username.lower()}:{posts_limit}"

    async def _run_pipeline(self, username: str, posts_limit: int) -> dict[str, Any]:
        started = perf_counter()
        logger.info("pipeline.start username=%s posts_limit=%s", username, posts_limit)
        if config.ANALYZE_USE_MOCK:
            logger.info("pipeline.mock_mode username=%s posts_limit=%s delay_ms=%s", username, posts_limit, config.ANALYZE_MOCK_DELAY_MS)
            result = await build_mock_analysis_payload(username, posts_limit)
            logger.info(
                "pipeline.complete username=%s posts=%s duration_ms=%s source=mock",
                username,
                len(result.get("posts", [])),
                round((perf_counter() - started) * 1000),
            )
            return result

        auth = self.instagram.get_auth_status()
        if auth.get("status") == "failed":
            logger.error("pipeline.auth_failed username=%s note=%s", username, auth.get("note"))
            raise RuntimeError(auth.get("note") or "Extractor no disponible")

        raw_posts = await self.instagram.get_raw_posts(username, posts_limit)
        logger.info("pipeline.raw_posts.loaded username=%s count=%s", username, len(raw_posts))
        metadata = self.instagram.build_profile_metadata_from_raw_posts(username, raw_posts)
        logger.info("pipeline.metadata.loaded username=%s followers=%s following=%s", username, metadata.get("followers"), metadata.get("following"))
        posts = self.instagram.normalize_recent_posts(raw_posts)
        logger.info("pipeline.posts.loaded username=%s count=%s", username, len(posts))
        if not posts:
            logger.warning("pipeline.posts.empty username=%s", username)
            raise ValueError("No se encontraron posts publicos para este perfil.")

        metrics = self.analysis.analyze(metadata, posts)
        apify_analysis = await self.instagram.analyze_posts(posts, followers_count=metrics.get("followers"))

        generated_at = datetime.now(timezone.utc).isoformat()
        top_hashtags = apify_analysis.get("top_hashtags", [])
        render_hints = {
            "seed": f"{username}:{generated_at}",
            "node_count": max(4, min(16, len(top_hashtags) + 1)),
            "energy": metrics.get("avg_engagement", 0),
            "dominant_hashtag": top_hashtags[0]["value"] if top_hashtags else None,
            "post_density": metrics.get("post_frequency", 0),
        }

        result = {
            "source": "apify",
            "status": "success",
            "username": metadata.get("username") or username,
            "generated_at": generated_at,
            "profile": {
                "username": metadata.get("username") or username,
                "full_name": metadata.get("full_name") or "",
                "source_url": f"https://www.instagram.com/{metadata.get('username') or username}/",
            },
            "metadata": metadata,
            "metrics": metrics,
            "analysis": apify_analysis,
            "posts": posts,
            "render_hints": render_hints,
        }
        logger.info(
            "pipeline.complete username=%s posts=%s duration_ms=%s",
            username,
            len(posts),
            round((perf_counter() - started) * 1000),
        )
        return result

    async def analyze_profile(self, username: str, posts_limit: int = 12) -> dict[str, Any]:
        job_key = self._build_job_key(username, posts_limit)
        async with self._inflight_lock:
            existing_task = self._inflight_jobs.get(job_key)
            if existing_task and not existing_task.done():
                logger.info("pipeline.reuse_inflight username=%s posts_limit=%s job_key=%s", username, posts_limit, job_key)
                task = existing_task
            else:
                logger.info("pipeline.create_inflight username=%s posts_limit=%s job_key=%s", username, posts_limit, job_key)
                task = asyncio.create_task(self._run_pipeline(username, posts_limit))
                self._inflight_jobs[job_key] = task

        try:
            return await task
        finally:
            async with self._inflight_lock:
                if self._inflight_jobs.get(job_key) is task and task.done():
                    self._inflight_jobs.pop(job_key, None)
