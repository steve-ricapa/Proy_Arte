from __future__ import annotations

from typing import Any

from core import config
from services.apify_instagram_service import (
    ApifyServiceError,
    analyze_instagram_posts,
    clean_instagram_username,
    fetch_instagram_posts,
)


class InstagramService:
    def __init__(self) -> None:
        token = (config.APIFY_TOKEN or "").strip()
        if token:
            self.auth_status = "configured"
            self.auth_note = "Extractor Apify habilitado."
        else:
            self.auth_status = "failed"
            self.auth_note = "APIFY_TOKEN no esta configurado en el backend."

    def get_auth_status(self) -> dict[str, str]:
        return {
            "status": self.auth_status,
            "note": self.auth_note,
        }

    def classify_error(self, exc: Exception) -> str:
        if isinstance(exc, ApifyServiceError):
            mapping = {
                "missing_token": "missing_token",
                "auth": "apify_auth",
                "timeout": "timeout",
                "upstream": "upstream",
                "network": "network",
                "invalid_output": "invalid_output",
            }
            return mapping.get(exc.error_type, "apify_error")

        msg = str(exc).lower()
        if "invalid instagram username" in msg or "username is required" in msg:
            return "invalid_username"
        if "no se encontraron posts" in msg:
            return "not_found"
        return "unknown"

    async def get_profile_metadata(self, username: str, posts_limit: int = 12) -> dict[str, Any]:
        safe_username = clean_instagram_username(username)
        posts = await fetch_instagram_posts(safe_username, limit=posts_limit)
        if not posts:
            raise ValueError("No se encontraron posts publicos para este perfil.")

        first = posts[0]
        return {
            "username": first.get("ownerUsername") or safe_username,
            "full_name": first.get("ownerFullName") or "",
            "biography": "",
            "followers": 0,
            "followees": 0,
            "posts_count": len(posts),
            "is_verified": False,
            "source": "apify",
        }

    async def get_recent_posts(self, username: str, limit: int = 12) -> list[dict[str, Any]]:
        safe_username = clean_instagram_username(username)
        posts = await fetch_instagram_posts(safe_username, limit=limit)
        if not posts:
            return []

        normalized: list[dict[str, Any]] = []
        for post in posts:
            normalized.append(
                {
                    "id": post.get("id"),
                    "caption": post.get("caption") or "",
                    "likes": int(post.get("likesCount") or 0),
                    "comments": int(post.get("commentsCount") or 0),
                    "timestamp": post.get("timestamp"),
                    "hashtags": post.get("hashtags") or [],
                    "mentions": post.get("mentions") or [],
                    "owner_username": post.get("ownerUsername"),
                    "owner_full_name": post.get("ownerFullName"),
                    "url": post.get("url") or post.get("inputUrl"),
                }
            )
        return normalized

    async def analyze_posts(self, posts: list[dict[str, Any]], followers_count: int | None = None) -> dict[str, Any]:
        payload = [
            {
                "id": post.get("id"),
                "caption": post.get("caption"),
                "likesCount": post.get("likes", 0),
                "commentsCount": post.get("comments", 0),
                "hashtags": post.get("hashtags", []),
                "mentions": post.get("mentions", []),
                "timestamp": post.get("timestamp"),
                "ownerUsername": post.get("owner_username"),
                "ownerFullName": post.get("owner_full_name"),
                "url": post.get("url"),
            }
            for post in posts
        ]
        return analyze_instagram_posts(payload, followers_count=followers_count)
