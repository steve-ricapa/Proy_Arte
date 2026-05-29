from __future__ import annotations

import re
from urllib.parse import urlparse


USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9._]{1,30}$")


def sanitize_instagram_username(raw: str) -> str:
    value = (raw or "").strip()
    if not value:
        raise ValueError("El username esta vacio.")

    if "instagram.com" in value.lower():
        parsed = urlparse(value if "://" in value else f"https://{value}")
        path_parts = [part for part in parsed.path.split("/") if part]
        if path_parts:
            candidate = path_parts[0]
            if candidate.lower() in {"p", "reel", "stories", "explore"} and len(path_parts) > 1:
                candidate = path_parts[1]
            value = candidate

    value = value.split("?")[0]
    value = value.split("/")[0]
    value = value.lstrip("@")

    if not USERNAME_PATTERN.fullmatch(value):
        raise ValueError(
            "Username invalido. Usa 1-30 caracteres con letras, numeros, punto o guion bajo."
        )

    return value
