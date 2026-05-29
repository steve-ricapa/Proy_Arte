from __future__ import annotations

import asyncio
import json

from services.apify_instagram_service import analyze_instagram_posts, fetch_instagram_posts


async def main() -> None:
    username = "humansofny"
    posts = await fetch_instagram_posts(username, limit=5)
    analysis = analyze_instagram_posts(posts)

    print("posts:", analysis["total_posts_analyzed"])
    print("avg_likes:", analysis["avg_likes"])
    print("avg_comments:", analysis["avg_comments"])
    print("top_hashtags:", analysis["top_hashtags"])
    if analysis["posts"]:
        print(json.dumps(analysis["posts"][0], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
