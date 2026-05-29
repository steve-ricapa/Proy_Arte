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


APIFY_TOKEN: str | None = os.getenv("APIFY_TOKEN")
APIFY_ACTOR_ID: str = os.getenv("APIFY_ACTOR_ID", "apify~instagram-scraper")
APIFY_POSTS_LIMIT: int = _to_int(os.getenv("APIFY_POSTS_LIMIT"), 12)
APIFY_TIMEOUT_SECONDS: int = _to_int(os.getenv("APIFY_TIMEOUT_SECONDS"), 180)
