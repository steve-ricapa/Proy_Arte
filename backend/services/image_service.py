from __future__ import annotations

import base64
import io
import math
import random
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


class ImageService:
    def __init__(self, width: int = 900, height: int = 900) -> None:
        self.width = width
        self.height = height

    def start_canvas(self) -> Image.Image:
        return Image.new("RGBA", (self.width, self.height), (9, 12, 18, 255))

    def batch_background(self, canvas: Image.Image, metrics: dict[str, Any]) -> Image.Image:
        arr = np.zeros((self.height, self.width, 4), dtype=np.uint8)
        followers = metrics.get("followers", 0)
        intensity = min(max(followers // 1000, 20), 220)

        for y in range(self.height):
            ratio = y / max(self.height - 1, 1)
            arr[y, :, 0] = np.clip(10 + intensity * ratio * 0.4, 0, 255)
            arr[y, :, 1] = np.clip(30 + intensity * ratio * 0.5, 0, 255)
            arr[y, :, 2] = np.clip(60 + intensity * ratio * 0.8, 0, 255)
            arr[y, :, 3] = 255

        gradient = Image.fromarray(arr, mode="RGBA")
        canvas.alpha_composite(gradient)
        return canvas

    def batch_main_node(self, canvas: Image.Image, metrics: dict[str, Any]) -> tuple[Image.Image, tuple[int, int], int]:
        draw = ImageDraw.Draw(canvas)
        cx, cy = self.width // 2, self.height // 2
        followers = max(metrics.get("followers", 0), 1)
        radius = min(220, 70 + int(math.log10(followers + 1) * 45))

        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(255, 214, 120, 180))
        draw.ellipse((cx - radius - 12, cy - radius - 12, cx + radius + 12, cy + radius + 12), outline=(255, 245, 200, 210), width=4)
        return canvas, (cx, cy), radius

    def batch_hashtag_nodes(
        self,
        canvas: Image.Image,
        metrics: dict[str, Any],
        center: tuple[int, int],
        main_radius: int,
    ) -> tuple[Image.Image, list[tuple[int, int, int]]]:
        draw = ImageDraw.Draw(canvas)
        hashtags = metrics.get("top_hashtags", [])[:8]
        if not hashtags:
            hashtags = [{"hashtag": "sin_tags", "count": 1}]

        nodes: list[tuple[int, int, int]] = []
        ring_radius = main_radius + 170
        angle_step = (2 * math.pi) / len(hashtags)

        for idx, tag in enumerate(hashtags):
            angle = idx * angle_step
            x = int(center[0] + math.cos(angle) * ring_radius)
            y = int(center[1] + math.sin(angle) * ring_radius)
            node_radius = 16 + min(tag.get("count", 1) * 5, 26)
            color_shift = random.randint(-20, 20)
            draw.ellipse(
                (x - node_radius, y - node_radius, x + node_radius, y + node_radius),
                fill=(
                    min(255, max(140, 170 + color_shift)),
                    min(255, max(80, 130 + color_shift)),
                    min(255, max(120, 170 + color_shift)),
                    210,
                ),
            )
            nodes.append((x, y, node_radius))

        return canvas, nodes

    def batch_connections(
        self,
        canvas: Image.Image,
        center: tuple[int, int],
        nodes: list[tuple[int, int, int]],
    ) -> Image.Image:
        draw = ImageDraw.Draw(canvas)
        cx, cy = center
        for x, y, radius in nodes:
            draw.line((cx, cy, x, y), fill=(255, 255, 255, 120), width=2)
            draw.ellipse((x - radius - 6, y - radius - 6, x + radius + 6, y + radius + 6), outline=(255, 255, 255, 70), width=2)
        return canvas

    def batch_details(self, canvas: Image.Image, metrics: dict[str, Any]) -> Image.Image:
        draw = ImageDraw.Draw(canvas)
        ratio = metrics.get("ratio", 0)
        engagement = metrics.get("avg_engagement", 0)
        posts_freq = metrics.get("post_frequency", 0)

        overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        o_draw = ImageDraw.Draw(overlay)
        o_draw.rectangle((24, self.height - 160, self.width - 24, self.height - 24), fill=(12, 18, 30, 180))
        o_draw.text((40, self.height - 142), f"ratio followers/following: {ratio}", fill=(237, 238, 240, 255))
        o_draw.text((40, self.height - 112), f"engagement promedio: {engagement}%", fill=(237, 238, 240, 255))
        o_draw.text((40, self.height - 82), f"frecuencia posts/semana: {posts_freq}", fill=(237, 238, 240, 255))

        canvas.alpha_composite(overlay)
        canvas = canvas.filter(ImageFilter.SMOOTH_MORE)

        stars = max(20, min(100, int(engagement * 5 + 20)))
        for _ in range(stars):
            x = random.randint(0, self.width - 1)
            y = random.randint(0, self.height - 1)
            draw.point((x, y), fill=(255, 255, 255, random.randint(70, 170)))

        return canvas

    def to_base64(self, canvas: Image.Image) -> str:
        buffer = io.BytesIO()
        canvas.convert("RGB").save(buffer, format="PNG", optimize=True)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")
