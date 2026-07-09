from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")


def _to_int(value: str | None, default: int) -> int:
    if value is None or value.strip() == "":
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


APIFY_KEYS: list[str] = [
    key
    for key in [
        os.getenv("APIFY_KEY1", "").strip(),
        os.getenv("APIFY_KEY2", "").strip(),
        os.getenv("APIFY_KEY3", "").strip(),
    ]
    if key
]
APIFY_ACTOR_ID: str = os.getenv("APIFY_ACTOR_ID", "apify~instagram-scraper")
APIFY_POSTS_LIMIT: int = _to_int(os.getenv("APIFY_POSTS_LIMIT"), 12)
APIFY_TIMEOUT_SECONDS: int = _to_int(os.getenv("APIFY_TIMEOUT_SECONDS"), 180)
ANALYZE_USE_MOCK: bool = _to_bool(os.getenv("ANALYZE_USE_MOCK"), False)
ANALYZE_MOCK_DELAY_MS: int = _to_int(os.getenv("ANALYZE_MOCK_DELAY_MS"), 500)
ANALYZE_MOCK_POSTS: int = _to_int(os.getenv("ANALYZE_MOCK_POSTS"), 50)
