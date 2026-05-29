import { SeededPRNG } from "../core/seededPrng";
import { InstagramAnalysisPayload, InstagramPost } from "../types/artwork.types";

export const parseDate = (value?: string) => {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export const getLikes = (post: InstagramPost) => Number(post.likes_count ?? post.likes ?? 0);
export const getComments = (post: InstagramPost) => Number(post.comments_count ?? post.comments ?? 0);

export const normalizePosts = (data: InstagramAnalysisPayload, prng: SeededPRNG): InstagramPost[] => {
  let list: InstagramPost[] = [];
  if (Array.isArray(data.analysis?.posts) && data.analysis.posts.length > 0) {
    list = data.analysis.posts;
  } else if (Array.isArray(data.posts) && data.posts.length > 0) {
    list = data.posts;
  }

  if (list.length === 0) {
    list = Array.from({ length: 36 }).map((_, i) => ({
      id: `DEC-${9821 + i}`,
      likes_count: prng.int(100, 1400),
      comments_count: prng.int(5, 75),
      hashtags: [prng.select(["arte", "estudio", "exhibicion", "generativo", "constelacion"])],
      mentions: [prng.select(["museo.digital", "expo.arte"])],
      timestamp: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      caption: `Deterministic representation for profile ${data.username || "Anonymous"}`,
    }));
  }

  return list;
};
