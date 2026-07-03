import { InstagramAnalysisPayload } from "./components/artwork/types/artwork.types";

const hashtagsPool = [
  ["digitalritual", "citysignal"],
  ["neonmemory", "selfarchive"],
  ["visiblematter", "nightfeed"],
  ["socialorbit", "afterimage"],
  ["networkedbody", "signalbloom"],
  ["attentioneconomy", "violettrace"],
];

const mentionsPool = [
  ["demo.lima", "juan_luismt_"],
  ["galeria.utec", "archivo.visible"],
  ["lima.nocturna"],
  ["demo.mas.lima", "luz.publica"],
  ["sistema.celeste"],
  ["protocolo.social", "demo.lima"],
];

const captions = [
  "Una prueba mas de presencia en el flujo nocturno.",
  "Publicar para permanecer visible entre miles de senales.",
  "La ciudad como interfaz, el cuerpo como emision.",
  "Cada imagen deja un residuo de luz en la memoria social.",
  "Una orbita breve antes del siguiente desplazamiento del feed.",
  "Brillar tambien puede ser una forma de cansancio.",
];

const countValues = (values: string[]) => {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));
};

export const createSamplePayload = (): InstagramAnalysisPayload => {
  const generatedAt = new Date();
  const endTime = generatedAt.getTime() - 1000 * 60 * 60 * 24 * 2;

  const posts = Array.from({ length: 30 }).map((_, idx) => {
    const timestamp = new Date(endTime - (29 - idx) * 1000 * 60 * 60 * 24 * 9).toISOString();
    const likes = 180 + (idx % 6) * 95 + idx * 34 + (idx % 4) * 20;
    const comments = 6 + (idx % 5) * 4 + Math.floor(idx / 3);
    const hashtags = hashtagsPool[idx % hashtagsPool.length];
    const mentions = mentionsPool[idx % mentionsPool.length];

    return {
      id: `demo-post-${idx + 1}-${generatedAt.getTime()}`,
      caption: `${captions[idx % captions.length]} Registro ${idx + 1}.`,
      likes_count: likes,
      comments_count: comments,
      hashtags,
      mentions,
      owner_username: "demo.lima",
      owner_full_name: "demo Lima",
      timestamp,
      url: `https://www.instagram.com/p/demo-post-${idx + 1}`,
    };
  });

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
  const bestPostByLikes = posts.reduce((best, post) => ((post.likes_count || 0) > (best.likes_count || 0) ? post : best), posts[0]);
  const bestPostByComments = posts.reduce((best, post) => ((post.comments_count || 0) > (best.comments_count || 0) ? post : best), posts[0]);
  const topHashtags = countValues(posts.flatMap((post) => post.hashtags || [])).slice(0, 6);
  const topMentions = countValues(posts.flatMap((post) => post.mentions || [])).slice(0, 6);

  return {
    username: "demo.lima",
    generated_at: generatedAt.toISOString(),
    metadata: {
      username: "demo.lima",
      full_name: "demo Lima",
      followers: 4200,
      following: 612,
    },
    metrics: {
      followers: 4200,
      following: 612,
      ratio: 6.86,
      avg_engagement: Number((totalLikes / posts.length).toFixed(2)),
      top_hashtags: topHashtags.map((tag) => ({ hashtag: tag.value, count: tag.count })),
    },
    analysis: {
      avg_likes: Number((totalLikes / posts.length).toFixed(2)),
      avg_comments: Number((totalComments / posts.length).toFixed(2)),
      top_hashtags: topHashtags,
      top_mentions: topMentions,
      best_post_by_likes: bestPostByLikes,
      best_post_by_comments: bestPostByComments,
      posts,
    },
    posts,
    render_hints: {
      seed: `demo.lima:${generatedAt.getTime()}`,
      energy: Number((totalLikes / posts.length).toFixed(2)),
    },
  };
};

const samplePayload = createSamplePayload();

export default samplePayload;
