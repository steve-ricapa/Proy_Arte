from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

import instaloader
from instaloader.exceptions import InstaloaderException


class InstagramService:
    def __init__(self) -> None:
        self.loader = instaloader.Instaloader(
            download_pictures=False,
            download_video_thumbnails=False,
            download_videos=False,
            save_metadata=False,
            compress_json=False,
            quiet=True,
        )

    async def get_profile_metadata(self, username: str) -> dict[str, Any]:
        return await asyncio.to_thread(self._get_profile_metadata_sync, username)

    def _get_profile_metadata_sync(self, username: str) -> dict[str, Any]:
        try:
            profile = instaloader.Profile.from_username(self.loader.context, username)
        except InstaloaderException as exc:
            raise ValueError(f"No se pudo obtener el perfil '{username}': {exc}") from exc

        return {
            "username": profile.username,
            "full_name": profile.full_name,
            "biography": profile.biography,
            "followers": profile.followers,
            "followees": profile.followees,
            "posts_count": profile.mediacount,
            "is_verified": profile.is_verified,
        }

    async def get_recent_posts(self, username: str, limit: int = 12) -> list[dict[str, Any]]:
        return await asyncio.to_thread(self._get_recent_posts_sync, username, limit)

    def _get_recent_posts_sync(self, username: str, limit: int) -> list[dict[str, Any]]:
        try:
            profile = instaloader.Profile.from_username(self.loader.context, username)
            posts: list[dict[str, Any]] = []
            for idx, post in enumerate(profile.get_posts()):
                if idx >= limit:
                    break
                posts.append(
                    {
                        "id": post.mediaid,
                        "shortcode": post.shortcode,
                        "caption": post.caption or "",
                        "likes": post.likes,
                        "comments": post.comments,
                        "timestamp": self._iso(post.date_utc),
                    }
                )
        except InstaloaderException as exc:
            raise ValueError(f"Error al descargar publicaciones: {exc}") from exc

        return posts

    @staticmethod
    def _iso(value: datetime) -> str:
        return value.isoformat()
