from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

from core import config


HASHTAGS = [
    ["digitalritual", "citysignal"],
    ["neonmemory", "selfarchive"],
    ["visiblematter", "nightfeed"],
    ["socialorbit", "afterimage"],
    ["networkedbody", "signalbloom"],
    ["attentioneconomy", "violettrace"],
]

MENTIONS = [
    ["demo.lima", "juan_luismt_"],
    ["galeria.utec", "archivo.visible"],
    ["lima.nocturna"],
    ["demo.mas.lima", "luz.publica"],
    ["sistema.celeste"],
    ["protocolo.social", "demo.lima"],
]

CAPTIONS = [
    "Una prueba mas de presencia en el flujo nocturno.",
    "Publicar para permanecer visible entre miles de senales.",
    "La ciudad como interfaz, el cuerpo como emision.",
    "Cada imagen deja un residuo de luz en la memoria social.",
    "Una orbita breve antes del siguiente desplazamiento del feed.",
    "Brillar tambien puede ser una forma de cansancio.",
]


def _count_values(values: list[str]) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return [
        {"value": value, "count": count}
        for value, count in sorted(counts.items(), key=lambda item: item[1], reverse=True)
    ]


async def build_mock_analysis_payload(username: str, posts_limit: int) -> dict[str, Any]:
    delay_ms = max(0, config.ANALYZE_MOCK_DELAY_MS)
    if delay_ms:
        await asyncio.sleep(delay_ms / 1000)

    posts_count = max(1, min(posts_limit, config.ANALYZE_MOCK_POSTS))
    generated_at = datetime.now(timezone.utc)
    end_time = generated_at - timedelta(days=2)

    posts: list[dict[str, Any]] = []
    for idx in range(posts_count):
        timestamp = (end_time - timedelta(days=(posts_count - idx) * 5, minutes=(idx * 11) % 60)).isoformat()
        likes = 180 + (idx % 6) * 95 + idx * 34 + (idx % 4) * 20
        comments = 6 + (idx % 5) * 4 + idx // 3
        posts.append(
            {
                "id": f"mock-{username}-{idx + 1}-{int(generated_at.timestamp())}",
                "caption": f"{CAPTIONS[idx % len(CAPTIONS)]} Registro {idx + 1}.",
                "likes": likes,
                "comments": comments,
                "hashtags": HASHTAGS[idx % len(HASHTAGS)],
                "mentions": MENTIONS[idx % len(MENTIONS)],
                "owner_username": username,
                "owner_full_name": username.replace(".", " ").title(),
                "timestamp": timestamp,
                "url": f"https://www.instagram.com/p/mock-{idx + 1}",
            }
        )

    total_likes = sum(post["likes"] for post in posts)
    total_comments = sum(post["comments"] for post in posts)
    top_hashtags = _count_values([tag for post in posts for tag in post.get("hashtags", [])])[:8]
    top_mentions = _count_values([tag for post in posts for tag in post.get("mentions", [])])[:8]
    best_by_likes = max(posts, key=lambda post: post["likes"])
    best_by_comments = max(posts, key=lambda post: post["comments"])
    avg_likes = round(total_likes / posts_count, 2)
    avg_comments = round(total_comments / posts_count, 2)

    return {
        "source": "mock",
        "status": "success",
        "username": username,
        "generated_at": generated_at.isoformat(),
        "profile": {
            "username": username,
            "full_name": username.replace(".", " ").title(),
            "source_url": f"https://www.instagram.com/{username}/",
        },
        "metadata": {
            "username": username,
            "full_name": username.replace(".", " ").title(),
            "followers": 4200,
            "following": 612,
            "posts_count": posts_count,
            "is_verified": False,
            "source": "mock",
        },
        "metrics": {
            "followers": 4200,
            "following": 612,
            "ratio": 6.86,
            "avg_engagement": avg_likes,
            "post_frequency": 0.55,
            "top_hashtags": [{"hashtag": tag["value"], "count": tag["count"]} for tag in top_hashtags],
        },
        "analysis": {
            "total_posts_analyzed": posts_count,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "avg_likes": avg_likes,
            "avg_comments": avg_comments,
            "top_hashtags": top_hashtags,
            "top_mentions": top_mentions,
            "best_post_by_likes": best_by_likes,
            "best_post_by_comments": best_by_comments,
            "posts": posts,
        },
        "posts": posts,
        "render_hints": {
            "seed": f"{username}:{generated_at.isoformat()}",
            "node_count": max(4, min(16, len(top_hashtags) + 1)),
            "energy": avg_likes,
            "dominant_hashtag": top_hashtags[0]["value"] if top_hashtags else None,
            "post_density": 0.55,
        },
    }
