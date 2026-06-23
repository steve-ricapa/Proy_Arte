import { SceneConfig, StarNode } from "../types/artwork.types";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const getTimelineTimestamp = (sceneConfig: SceneConfig, progress: number) => {
  const t = clamp(progress);
  return sceneConfig.timelineStartMs + (sceneConfig.timelineEndMs - sceneConfig.timelineStartMs) * t;
};

export const getNodeTimelineState = (star: StarNode, sceneConfig: SceneConfig, currentTimestamp: number) => {
  const totalRange = Math.max(1, sceneConfig.timelineEndMs - sceneConfig.timelineStartMs);
  const fadeWindow = Math.max(totalRange * 0.035, 1000 * 60 * 60 * 12);

  // Star lifetime is 48% of the total timeline duration
  const lifetimeMs = totalRange * 0.48;
  const ageMs = currentTimestamp - star.timestampMs;
  const clampedAgeMs = Math.max(0, Math.min(ageMs, lifetimeMs));
  const appearance = clamp(clampedAgeMs / fadeWindow);
  const lifeRatio = clamp(clampedAgeMs / lifetimeMs);

  if (ageMs < 0) {
    return {
      isVisible: false,
      appearance: 0,
      ageRatio: 0,
      alphaMultiplier: 0,
      glowMultiplier: 0,
      freshPulse: 0,
      isDead: false,
    };
  }

  if (ageMs >= lifetimeMs) {
    return {
      isVisible: false,
      appearance: 1,
      ageRatio: 1,
      alphaMultiplier: 0,
      glowMultiplier: 0,
      freshPulse: 0,
      isDead: true,
    };
  }

  // Fades out as ageMs approaches lifetimeMs (more rapidly after 75% lifetime)
  const fadeStart = 0.82;
  const fadeRatio = lifeRatio < fadeStart ? 0 : clamp((lifeRatio - fadeStart) / (1 - fadeStart));
  const residualLight = 1 - fadeRatio;
  
  const freshPulse = 1 - clamp(ageMs / (fadeWindow * 1.8));

  return {
    isVisible: true,
    appearance,
    ageRatio: lifeRatio,
    alphaMultiplier: appearance * residualLight,
    glowMultiplier: appearance * (residualLight + freshPulse * 0.2),
    freshPulse,
    isDead: false,
  };
};

export const isNodeVisibleAtTime = (star: StarNode, sceneConfig: SceneConfig, currentTimestamp: number) => {
  return getNodeTimelineState(star, sceneConfig, currentTimestamp).isVisible;
};

export const getStarPositionAtTime = (star: StarNode, sceneConfig: SceneConfig, currentTimestamp: number) => {
  const timeline = getNodeTimelineState(star, sceneConfig, currentTimestamp);
  const cx = star.x - Math.cos(star.angle) * star.baseDistance;
  const cy = star.y - Math.sin(star.angle) * star.baseDistance;
  const easedAge = 1 - Math.pow(1 - timeline.ageRatio, 2);
  const distance = star.baseDistance + star.driftStrength * 1.9 * easedAge;

  return {
    x: cx + Math.cos(star.angle) * distance,
    y: cy + Math.sin(star.angle) * distance,
    distance,
  };
};
