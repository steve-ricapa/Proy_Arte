import p5 from "p5";
import { PALETTES, blendColor, getProfilePalette } from "../core/palettes";
import { SeededPRNG } from "../core/seededPrng";
import { getComments, getLikes, normalizePosts, parseDate } from "../data/posts";
import { InstagramAnalysisPayload, PlanetType, SceneConfig } from "../types/artwork.types";

export const buildSceneConfig = (
  p: p5,
  payload: InstagramAnalysisPayload,
  cw: number,
  ch: number
): SceneConfig => {
  const seed = `${payload.username}:${payload.render_hints?.seed || payload.generated_at || "exhibition-seed"}`;
  const prng = new SeededPRNG(seed);
  const canvasScale = Math.max(0.8, Math.min(1.8, Math.min(cw, ch) / 720));

  const posts = normalizePosts(payload, prng);
  const maxLikes = Math.max(1, ...posts.map(getLikes));
  const maxComments = Math.max(1, ...posts.map(getComments));
  const totalLikes = posts.reduce((sum, post) => sum + getLikes(post), 0);

  let bestPostByLikes = payload.analysis?.best_post_by_likes;
  let bestPostByComments = payload.analysis?.best_post_by_comments;
  if (!bestPostByLikes && posts.length > 0) bestPostByLikes = posts.reduce((prev, curr) => (getLikes(curr) > getLikes(prev) ? curr : prev), posts[0]);
  if (!bestPostByComments && posts.length > 0) bestPostByComments = posts.reduce((prev, curr) => (getComments(curr) > getComments(prev) ? curr : prev), posts[0]);

  const fallbackEnd = Date.now();
  const fallbackStart = fallbackEnd - Math.max(1, posts.length - 1) * 86400000 * 3;
  const resolvedTimestamps = posts.map((post, idx) => {
    const parsed = parseDate(post.timestamp);
    if (parsed > 0) return parsed;
    const ratio = posts.length <= 1 ? 0 : idx / (posts.length - 1);
    return fallbackStart + (fallbackEnd - fallbackStart) * ratio;
  });
  const newest = Math.max(...resolvedTimestamps);
  const oldest = Math.min(...resolvedTimestamps);
  const rawRange = Math.max(1, newest - oldest);
  const timelinePadding = Math.max(rawRange * 0.03, 1000 * 60 * 60 * 24);
  const timelineStartMs = oldest - timelinePadding;
  const timelineEndMs = newest;

  const mainTag = payload.analysis?.top_hashtags?.[0]?.value || "";
  const palette = getProfilePalette(mainTag, payload.username);

  const bgStarCount = Math.max(70, Math.min(220, Math.round(Math.log10(totalLikes + 10) * 42)));
  const bgStars = Array.from({ length: bgStarCount }).map(() => ({
    x: prng.range(30, cw - 30),
    y: prng.range(30, ch - 30),
    r: prng.range(0.45, 2.6),
    a: prng.range(18, 110),
  }));

  const energy = Number(payload.metrics?.avg_engagement || payload.render_hints?.energy || 150);
  const cloudIntensity = p.constrain(p.map(energy, 0, 1500, 0.4, 1.0), 0.3, 1);
  const blobCount = 190;
  const radiusBound = Math.min(cw, ch) * 0.43;

  const cloudBlobs = Array.from({ length: blobCount }).map((_, i) => {
    const angle = (i / blobCount) * p.TWO_PI;
    const radialDist = prng.range(35, radiusBound);
    const x = cw / 2 + Math.cos(angle) * radialDist * prng.range(0.45, 1.0);
    const y = ch / 2 + Math.sin(angle) * radialDist * prng.range(0.45, 1.0);

    const distRatio = radialDist / radiusBound;
    let c1: [number, number, number];
    let c2: [number, number, number];
    if (distRatio < 0.35) {
      c1 = prng.select(PALETTES.cosmicViolet);
      c2 = prng.select(PALETTES.astroGold);
    } else if (distRatio < 0.7) {
      c1 = prng.select(PALETTES.solarFlare);
      c2 = prng.select(PALETTES.oceanicDeep);
    } else {
      c1 = prng.select(PALETTES.oceanicDeep);
      c2 = prng.select(PALETTES.nebulaGreen);
    }
    const color = blendColor(c1, c2, prng.next());

    const numPoints = 9 + prng.int(0, 5);
    const blobW = 75 + prng.range(0, 135);
    const blobH = 75 + prng.range(0, 135);
    const vertices: { x: number; y: number }[] = [];
    for (let j = 0; j < numPoints; j += 1) {
      const a = (j / numPoints) * p.TWO_PI;
      const wobble = 0.6 + prng.range(0, 0.6);
      vertices.push({ x: Math.cos(a) * blobW * 0.5 * wobble, y: Math.sin(a) * blobH * 0.5 * wobble });
    }

    return { x, y, vertices, color, alpha: prng.range(7, 17) * cloudIntensity };
  });

  const planetPalettes = [
    [215, 80, 50],
    [242, 180, 92],
    [230, 160, 40],
    [75, 125, 230],
    [110, 220, 205],
    [220, 110, 140],
    [70, 180, 140],
  ] as [number, number, number][];

  const stars = posts.map((post, idx) => {
    const likes = getLikes(post);
    const comments = getComments(post);
    const likeRatio = likes / maxLikes;
    const commentRatio = comments / maxComments;
    const t = resolvedTimestamps[idx];
    const recencyRatio = newest > oldest ? (newest - t) / (newest - oldest) : prng.next();
    const baseDistance = p.map(recencyRatio, 0, 1, 3, Math.min(cw, ch) * 0.08);
    const angle = idx * 2.39996 + prng.range(-0.06, 0.06);
    const starX = cw / 2 + Math.cos(angle) * baseDistance;
    const starY = ch / 2 + Math.sin(angle) * baseDistance;
    const firstTag = (post.hashtags?.[0] || mainTag) as string;
    const nodeColor = firstTag ? getProfilePalette(firstTag, payload.username)[1] : palette[1];
    const mentionCount = Math.min(4, post.mentions?.length || 0);
    const satellites = Array.from({ length: mentionCount }).map((_, mIdx) => ({
      angleOffset: (mIdx / Math.max(1, mentionCount)) * p.TWO_PI + prng.range(0, p.HALF_PI),
      radius: (15 + prng.range(6, 17)) * canvasScale,
      size: prng.range(2.5, 5) * canvasScale,
    }));

    const types: PlanetType[] = ["gas_giant", "ringed", "rocky"];

    return {
      id: post.id || `node-${idx}`,
      x: starX,
      y: starY,
      baseDistance,
      angle,
      driftStrength: p.map(likeRatio, 0, 1, 42, Math.min(cw, ch) * 0.22) + prng.range(8, 30),
      radius: p.map(likeRatio, 0, 1, 6, 21) * canvasScale,
      glow: p.map(commentRatio, 0, 1, 15, 42) * canvasScale,
      color: nodeColor,
      post,
      timestampMs: t,
      timeRatio: timelineEndMs > timelineStartMs ? (t - timelineStartMs) / (timelineEndMs - timelineStartMs) : 1,
      likes,
      comments,
      isBestLikes: post.id === bestPostByLikes?.id || likes === maxLikes,
      isBestComments: post.id === bestPostByComments?.id || (comments === maxComments && comments > 0),
      rings: Math.max(0, Math.min(3, Math.floor(comments / 25))),
      satellites,
      planetType: prng.select(types),
      planetColor: prng.select(planetPalettes),
      accentColor: prng.select(planetPalettes),
      ringAngle: prng.range(-0.4, 0.4),
    };
  });

  const connections: SceneConfig["connections"] = [];
  for (let i = 0; i < stars.length; i += 1) {
    for (let j = i + 1; j < stars.length; j += 1) {
      const m1 = new Set((stars[i].post.mentions || []).map((m) => m.toLowerCase()));
      const m2 = new Set((stars[j].post.mentions || []).map((m) => m.toLowerCase()));
      let shared = 0;
      m1.forEach((m) => {
        if (m2.has(m)) shared += 1;
      });
      if (shared > 0) connections.push({ fromIdx: i, toIdx: j, weight: shared, type: "mention" });
    }
  }

  for (let i = 0; i < stars.length; i += 1) {
    let nearestIdx = -1;
    let secondNearestIdx = -1;
    let minD = Infinity;
    let minD2 = Infinity;
    for (let j = 0; j < stars.length; j += 1) {
      if (i === j) continue;
      const d = p.dist(stars[i].x, stars[i].y, stars[j].x, stars[j].y);
      if (d < minD) {
        minD2 = minD;
        secondNearestIdx = nearestIdx;
        minD = d;
        nearestIdx = j;
      } else if (d < minD2) {
        minD2 = d;
        secondNearestIdx = j;
      }
    }
    if (nearestIdx !== -1) connections.push({ fromIdx: i, toIdx: nearestIdx, weight: 1, type: "proximity" });
    if (secondNearestIdx !== -1 && prng.next() > 0.45) connections.push({ fromIdx: i, toIdx: secondNearestIdx, weight: 1, type: "proximity" });
  }

  const technicalGrid: SceneConfig["technicalGrid"] = [];
  const gridSize = 120;
  for (let gx = gridSize; gx < cw; gx += gridSize) technicalGrid.push({ x1: gx, y1: 30, x2: gx, y2: ch - 30 });
  for (let gy = gridSize; gy < ch; gy += gridSize) technicalGrid.push({ x1: 30, y1: gy, x2: cw - 30, y2: gy });

  const compassTicks: SceneConfig["compassTicks"] = [];
  const cx = cw / 2;
  const cy = ch / 2;
  const dialRadius = 160;
  for (let d = 0; d < 360; d += 15) {
    const rad = p.radians(d);
    const innerR = dialRadius - (d % 90 === 0 ? 8 : 4);
    compassTicks.push({
      x1: cx + Math.cos(rad) * innerR,
      y1: cy + Math.sin(rad) * innerR,
      x2: cx + Math.cos(rad) * dialRadius,
      y2: cy + Math.sin(rad) * dialRadius,
    });
  }

  let nameHash = 0;
  for (let k = 0; k < payload.username.length; k += 1) nameHash = (nameHash * 31 + payload.username.charCodeAt(k)) >>> 0;
  const catalogNumber = `DEC-${1000 + (nameHash % 9000)}-${new Date(payload.generated_at || Date.now()).getFullYear()}`;

  return {
    bgStars,
    cloudBlobs,
    stars,
    connections,
    technicalGrid,
    compassTicks,
    catalogNumber,
    oldestPostMs: oldest,
    newestPostMs: newest,
    timelineStartMs,
    timelineEndMs,
  };
};
