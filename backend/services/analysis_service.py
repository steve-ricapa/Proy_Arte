from __future__ import annotations

import re
from collections import Counter
from datetime import datetime
from typing import Any


HASHTAG_PATTERN = re.compile(r"#(\w+)")


class AnalysisService:
    def analyze(self, metadata: dict[str, Any], posts: list[dict[str, Any]]) -> dict[str, Any]:
        followers = metadata.get("followers", 0)
        following = metadata.get("followees", 0)
        ratio = round(followers / following, 3) if following else float(followers)

        top_hashtags = self._top_hashtags(posts)
        frequency = self._posts_per_week(posts)
        engagement = self._avg_engagement(posts, followers)

        return {
            "followers": followers,
            "following": following,
            "ratio": ratio,
            "post_frequency": frequency,
            "top_hashtags": top_hashtags,
            "avg_engagement": engagement,
            "captions_count": len([p for p in posts if p.get("caption")]),
        }

    def _top_hashtags(self, posts: list[dict[str, Any]]) -> list[dict[str, Any]]:
        counter: Counter[str] = Counter()
        for post in posts:
            caption = post.get("caption", "")
            tags = [t.lower() for t in HASHTAG_PATTERN.findall(caption)]
            counter.update(tags)

        return [
            {"hashtag": tag, "count": count}
            for tag, count in counter.most_common(8)
        ]

    def _posts_per_week(self, posts: list[dict[str, Any]]) -> float:
        if len(posts) < 2:
            return float(len(posts))

        dates = sorted(
            [datetime.fromisoformat(post["timestamp"]) for post in posts if post.get("timestamp")]
        )
        if len(dates) < 2:
            return float(len(posts))

        total_days = max((dates[-1] - dates[0]).days, 1)
        weeks = total_days / 7
        return round(len(posts) / max(weeks, 1 / 7), 2)

    def _avg_engagement(self, posts: list[dict[str, Any]], followers: int) -> float:
        if not posts:
            return 0.0

        interactions = [post.get("likes", 0) + post.get("comments", 0) for post in posts]
        avg_interactions = sum(interactions) / len(interactions)

        if followers <= 0:
            return round(avg_interactions, 2)
        return round((avg_interactions / followers) * 100, 2)
