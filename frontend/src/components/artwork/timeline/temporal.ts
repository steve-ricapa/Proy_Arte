import { SceneConfig, StarNode } from "../types/artwork.types";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const getTimelineTimestamp = (sceneConfig: SceneConfig, progress: number) => {
  const t = clamp(progress);
  return sceneConfig.timelineStartMs + (sceneConfig.timelineEndMs - sceneConfig.timelineStartMs) * t;
};

export const getNodeTimelineState = (star: StarNode, sceneConfig: SceneConfig, currentTimestamp: number) => {
  const totalRange = Math.max(1, sceneConfig.timelineEndMs - sceneConfig.timelineStartMs);
  const fadeWindow = Math.max(totalRange * 0.035, 1000 * 60 * 60 * 12);
  const ageMs = currentTimestamp - star.timestampMs;

  if (ageMs < 0) {
    return {
      isVisible: false,
      appearance: 0,
      ageRatio: 0,
      alphaMultiplier: 0,
      glowMultiplier: 0,
      freshPulse: 0,
    };
  }

  const appearance = clamp(ageMs / fadeWindow);
  const ageRatio = clamp(ageMs / totalRange);
  const residualLight = 0.48 + (1 - ageRatio) * 0.52;
  const freshPulse = 1 - clamp(ageMs / (fadeWindow * 1.8));

  return {
    isVisible: true,
    appearance,
    ageRatio,
    alphaMultiplier: appearance * residualLight,
    glowMultiplier: appearance * (0.58 + (1 - ageRatio) * 0.52 + freshPulse * 0.18),
    freshPulse,
  };
};

export const isNodeVisibleAtTime = (star: StarNode, sceneConfig: SceneConfig, currentTimestamp: number) => {
  return getNodeTimelineState(star, sceneConfig, currentTimestamp).isVisible;
};
