from __future__ import annotations

from collections import Counter
import re
from typing import Any
from urllib.parse import urlparse

import httpx

from core import config


USERNAME_RE = re.compile(r"^[A-Za-z0-9._]{1,30}$")


class ApifyServiceError(RuntimeError):
    def __init__(self, message: str, *, status_code: int = 502, error_type: str = "apify_error") -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_type = error_type


def clean_instagram_username(value: str) -> str:
    if not value or not value.strip():
        raise ValueError("Username is required")

    raw = value.strip()
    if "instagram.com" in raw.lower() or raw.startswith("http://") or raw.startswith("https://"):
        parsed = urlparse(raw if "://" in raw else f"https://{raw}")
        parts = [part for part in parsed.path.split("/") if part]
        if not parts:
            raise ValueError("Instagram URL does not contain a username")
        raw = parts[0]

    raw = raw.split("?")[0]
    raw = raw.split("/")[0]
    raw = raw.lstrip("@").strip()

    if not raw or not USERNAME_RE.fullmatch(raw):
        raise ValueError("Invalid Instagram username")

    return raw


def build_instagram_profile_url(username_or_url: str) -> str:
    username = clean_instagram_username(username_or_url)
    return f"https://www.instagram.com/{username}/"


async def run_apify_instagram_scraper(payload: dict[str, Any]) -> list[dict[str, Any]]:
    token = (config.APIFY_TOKEN or "").strip()
    if not token:
        raise ApifyServiceError("APIFY_TOKEN no esta configurado en el backend.", status_code=500, error_type="missing_token")

    url = f"https://api.apify.com/v2/acts/{config.APIFY_ACTOR_ID}/run-sync-get-dataset-items"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=config.APIFY_TIMEOUT_SECONDS) as client:
            response = await client.post(url, json=payload, headers=headers)
    except httpx.TimeoutException as exc:
        raise ApifyServiceError(
            "La extraccion tardo demasiado. Intenta con menos posts.",
            status_code=504,
            error_type="timeout",
        ) from exc
    except httpx.HTTPError as exc:
        raise ApifyServiceError("Error consultando Apify.", status_code=502, error_type="network") from exc

    if response.status_code in {401, 403}:
        raise ApifyServiceError("Apify token invalido o sin permisos.", status_code=502, error_type="auth")

    if response.status_code not in {200, 201}:
        safe_text = response.text[:500]
        raise ApifyServiceError(
            f"Error consultando Apify. status={response.status_code} detail={safe_text}",
            status_code=502,
            error_type="upstream",
        )

    data = response.json()
    if not isinstance(data, list):
        raise ApifyServiceError("Respuesta invalida de Apify (no es lista).", status_code=502, error_type="invalid_output")

    return data


async def fetch_instagram_posts(username_or_url: str, limit: int | None = None) -> list[dict[str, Any]]:
    profile_url = build_instagram_profile_url(username_or_url)

    safe_limit = config.APIFY_POSTS_LIMIT if limit is None else limit
    safe_limit = max(1, min(100, safe_limit))

    payload = {
        "directUrls": [profile_url],
        "resultsType": "posts",
        "resultsLimit": safe_limit,
    }
    return await run_apify_instagram_scraper(payload)


def normalize_post(post: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": post.get("id"),
        "caption": post.get("caption") or "",
        "likes_count": int(post.get("likesCount") or 0),
        "comments_count": int(post.get("commentsCount") or 0),
        "hashtags": post.get("hashtags") or [],
        "mentions": post.get("mentions") or [],
        "timestamp": post.get("timestamp"),
        "owner_username": post.get("ownerUsername"),
        "owner_full_name": post.get("ownerFullName"),
        "url": post.get("url") or post.get("inputUrl"),
    }


def analyze_instagram_posts(posts: list[dict[str, Any]], followers_count: int | None = None) -> dict[str, Any]:
    normalized = [normalize_post(post) for post in posts]
    total_posts = len(normalized)

    total_likes = sum(post["likes_count"] for post in normalized)
    total_comments = sum(post["comments_count"] for post in normalized)
    avg_likes = round(total_likes / total_posts, 2) if total_posts else 0.0
    avg_comments = round(total_comments / total_posts, 2) if total_posts else 0.0

    hashtags_counter: Counter[str] = Counter()
    mentions_counter: Counter[str] = Counter()
    for post in normalized:
        hashtags_counter.update([str(tag).lstrip("#").lower() for tag in post.get("hashtags", []) if tag])
        mentions_counter.update([str(tag).lstrip("@").lower() for tag in post.get("mentions", []) if tag])

    top_hashtags = [{"value": tag, "count": count} for tag, count in hashtags_counter.most_common(8)]
    top_mentions = [{"value": tag, "count": count} for tag, count in mentions_counter.most_common(8)]

    best_by_likes = max(normalized, key=lambda p: p["likes_count"], default=None)
    best_by_comments = max(normalized, key=lambda p: p["comments_count"], default=None)

    response: dict[str, Any] = {
        "total_posts_analyzed": total_posts,
        "total_likes": total_likes,
        "total_comments": total_comments,
        "avg_likes": avg_likes,
        "avg_comments": avg_comments,
        "top_hashtags": top_hashtags,
        "top_mentions": top_mentions,
        "best_post_by_likes": best_by_likes,
        "best_post_by_comments": best_by_comments,
        "posts": normalized,
    }

    if followers_count is not None and followers_count > 0:
        response["avg_engagement_rate_percent"] = round(((avg_likes + avg_comments) / followers_count) * 100, 2)

    return response
