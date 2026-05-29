from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from services.analysis_service import AnalysisService
from services.instagram_service import InstagramService


class PipelineService:
    def __init__(self) -> None:
        self.instagram = InstagramService()
        self.analysis = AnalysisService()

    def get_auth_status(self) -> dict[str, Any]:
        return self.instagram.get_auth_status()

    def get_extractor_status(self) -> dict[str, Any]:
        return {"auth": self.instagram.get_auth_status()}

    async def analyze_profile(self, username: str, posts_limit: int = 12) -> dict[str, Any]:
        auth = self.instagram.get_auth_status()
        if auth.get("status") == "failed":
            raise RuntimeError(auth.get("note") or "Extractor no disponible")

        metadata = await self.instagram.get_profile_metadata(username, posts_limit)
        posts = await self.instagram.get_recent_posts(username, posts_limit)
        if not posts:
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

        return {
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
