from __future__ import annotations

from collections import Counter
import logging
import re
from time import perf_counter
from typing import Any
from urllib.parse import urlparse

import httpx

from core import config


logger = logging.getLogger(__name__)


_key_index = 0


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
    global _key_index

    keys = config.APIFY_KEYS
    if not keys:
        raise ApifyServiceError("No hay APIFY_KEY configuradas en el backend.", status_code=500, error_type="missing_token")

    url = f"https://api.apify.com/v2/acts/{config.APIFY_ACTOR_ID}/run-sync-get-dataset-items"

    started = perf_counter()
    logger.info(
        "apify.request.start actor_id=%s results_limit=%s timeout_s=%s direct_urls=%s",
        config.APIFY_ACTOR_ID,
        payload.get("resultsLimit"),
        config.APIFY_TIMEOUT_SECONDS,
        payload.get("directUrls"),
    )

    auth_failure: ApifyServiceError | None = None
    start_index = _key_index % len(keys)

    try:
        async with httpx.AsyncClient(timeout=config.APIFY_TIMEOUT_SECONDS) as client:
            for offset in range(len(keys)):
                key_idx = (start_index + offset) % len(keys)
                key = keys[key_idx]
                headers = {
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }

                logger.info("apify.request.key_attempt key_index=%s", key_idx + 1)
                try:
                    response = await client.post(url, json=payload, headers=headers)
                except httpx.TimeoutException as exc:
                    logger.error(
                        "apify.request.timeout key_index=%s results_limit=%s duration_ms=%s",
                        key_idx + 1,
                        payload.get("resultsLimit"),
                        round((perf_counter() - started) * 1000),
                    )
                    raise ApifyServiceError(
                        "La extraccion tardo demasiado. Intenta con menos posts.",
                        status_code=504,
                        error_type="timeout",
                    ) from exc
                except httpx.HTTPError as exc:
                    logger.exception(
                        "apify.request.network_error key_index=%s results_limit=%s",
                        key_idx + 1,
                        payload.get("resultsLimit"),
                    )
                    raise ApifyServiceError("Error consultando Apify.", status_code=502, error_type="network") from exc

                if response.status_code in {401, 402, 403}:
                    safe_text = response.text[:500]
                    logger.warning(
                        "apify.request.key_rejected key_index=%s status=%s detail=%s",
                        key_idx + 1,
                        response.status_code,
                        safe_text,
                    )
                    auth_failure = ApifyServiceError(
                        "Apify token invalido, sin permisos o sin creditos.",
                        status_code=502,
                        error_type="auth",
                    )
                    continue

                if response.status_code not in {200, 201}:
                    safe_text = response.text[:500]
                    logger.error("apify.request.upstream_error status=%s detail=%s", response.status_code, safe_text)
                    raise ApifyServiceError(
                        f"Error consultando Apify. status={response.status_code} detail={safe_text}",
                        status_code=502,
                        error_type="upstream",
                    )

                data = response.json()
                if not isinstance(data, list):
                    logger.error("apify.request.invalid_output type=%s", type(data).__name__)
                    raise ApifyServiceError("Respuesta invalida de Apify (no es lista).", status_code=502, error_type="invalid_output")

                _key_index = key_idx
                logger.info(
                    "apify.request.success status=%s items=%s duration_ms=%s key_index=%s",
                    response.status_code,
                    len(data),
                    round((perf_counter() - started) * 1000),
                    key_idx + 1,
                )
                return data
    finally:
        if keys:
            _key_index %= len(keys)

    if auth_failure is not None:
        raise ApifyServiceError(
            "Todas las APIFY_KEY configuradas fueron rechazadas o se quedaron sin creditos.",
            status_code=502,
            error_type="auth",
        )

    raise ApifyServiceError("Error consultando Apify.", status_code=502, error_type="upstream")


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
