import p5 from "p5";

import { getNodeTimelineState, getStarPositionAtTime } from "../timeline/temporal";
import { SceneConfig } from "../types/artwork.types";

const getFade = (phase: number, phaseTick: number, targetPhase: number): number => {
  if (phase < targetPhase) return 0;
  if (phase > targetPhase) return 1;
  const t = phaseTick / 24.0;
  return 0.5 * (1 - Math.cos(t * Math.PI));
};

export const drawScene = (
  p: p5,
  sceneConfig: SceneConfig,
  phase: number,
  phaseTick: number,
  cw: number,
  ch: number,
  currentTimestamp: number,
  view: { zoom: number; panX: number; panY: number }
) => {
  p.background(0, 0, 0);

  const anyScene = sceneConfig as any;
  if (!anyScene.explosions) {
    anyScene.explosions = [];
  }
  if (!anyScene.explodedStarIds) {
    anyScene.explodedStarIds = new Set<string>();
  }
  if (anyScene.lastTimestamp === undefined) {
    anyScene.lastTimestamp = currentTimestamp;
  }

  // If time moves backwards (scrubbing), reset the explosions
  if (currentTimestamp < anyScene.lastTimestamp) {
    anyScene.explosions = [];
    anyScene.explodedStarIds.clear();
  }
  anyScene.lastTimestamp = currentTimestamp;

  const maxR = Math.max(cw, ch);
  p.noStroke();
  for (let r = maxR; r > 0; r -= 18) {
    const alpha = p.map(r, maxR, 0, 38, 0);
    p.fill(4, 4, 8, alpha);
    p.ellipse(cw / 2, ch / 2, r * 1.28, r * 1.18);
  }

  const fade1 = getFade(phase, phaseTick, 1);
  const fade2 = getFade(phase, phaseTick, 2);
  const fade3 = getFade(phase, phaseTick, 3);

  p.push();
  p.translate(view.panX, view.panY);
  p.scale(view.zoom);

  if (fade1 > 0) {
    p.noStroke();
    sceneConfig.bgStars.forEach((star) => {
      const shimmer = 0.72 + 0.28 * Math.sin((star.x + star.y) * 0.01 + currentTimestamp * 0.00008);
      p.fill(235, 245, 255, star.a * fade1 * shimmer);
      p.circle(star.x, star.y, star.r);
      if (star.r > 1.8) {
        p.fill(255, 255, 255, star.a * 0.22 * fade1 * shimmer);
        p.circle(star.x, star.y, star.r * 2.1);
      }
    });
  }

  if (fade2 > 0) {
    p.noStroke();
    sceneConfig.cloudBlobs.forEach((blob) => {
      p.fill(blob.color[0], blob.color[1], blob.color[2], blob.alpha * fade2);
      p.beginShape();
      blob.vertices.forEach((v) => p.vertex(blob.x + v.x, blob.y + v.y));
      p.endShape(p.CLOSE);
    });
  }

  if (phase < 5) {
    p.pop();
    return;
  }

  sceneConfig.connections.forEach((conn) => {
    const from = sceneConfig.stars[conn.fromIdx];
    const to = sceneConfig.stars[conn.toIdx];
    const fromTimeline = getNodeTimelineState(from, sceneConfig, currentTimestamp);
    const toTimeline = getNodeTimelineState(to, sceneConfig, currentTimestamp);
    if (!fromTimeline.isVisible || !toTimeline.isVisible) return;
    const fromPos = getStarPositionAtTime(from, sceneConfig, currentTimestamp);
    const toPos = getStarPositionAtTime(to, sceneConfig, currentTimestamp);

    const lineAlpha = Math.min(fromTimeline.alphaMultiplier, toTimeline.alphaMultiplier);
    if (conn.type === "mention") {
      p.stroke(110, 210, 255, 38 * lineAlpha);
      p.strokeWeight(1.05);
    } else {
      p.stroke(242, 180, 92, 20 * lineAlpha);
      p.strokeWeight(0.5);
    }
    p.line(fromPos.x, fromPos.y, toPos.x, toPos.y);
  });

  sceneConfig.stars.forEach((originalStar) => {
    const timeline = getNodeTimelineState(originalStar, sceneConfig, currentTimestamp);
    const starPosition = getStarPositionAtTime(originalStar, sceneConfig, currentTimestamp);

    // Trigger explosion if dead and not yet exploded
    if ((timeline as any).isDead && !anyScene.explodedStarIds.has(originalStar.id)) {
      anyScene.explodedStarIds.add(originalStar.id);

      // Spawn colored particles
      const particleCount = Math.floor(p.random(35, 55));
      for (let i = 0; i < particleCount; i++) {
        const angle = p.random(p.TWO_PI);
        const speed = p.random(1.2, 5.2);
        anyScene.explosions.push({
          x: starPosition.x,
          y: starPosition.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: p.random(2, 6),
          color: originalStar.planetColor,
          alpha: p.random(180, 255),
          decay: p.random(1.2, 3.2) // Slower decay for longer life (was 3 to 7)
        });
      }

      // Spawn white flash particles
      for (let i = 0; i < 10; i++) {
        const angle = p.random(p.TWO_PI);
        const speed = p.random(0.5, 2.5);
        anyScene.explosions.push({
          x: starPosition.x,
          y: starPosition.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: p.random(3, 7),
          color: [255, 255, 255],
          alpha: 255,
          decay: p.random(4, 8) // Slower flash decay (was 8 to 14)
        });
      }
    }

    if (!timeline.isVisible) return;

    // Shadow star with birthScale to animate planet creation size
    const birthScale = Math.sin(timeline.appearance * Math.PI / 2);
    const star = {
      ...originalStar,
      x: starPosition.x,
      y: starPosition.y,
      radius: originalStar.radius * birthScale,
      glow: originalStar.glow * birthScale
    };
    
    // Draw birth shockwave ripple
    if (timeline.appearance > 0 && timeline.appearance < 1.0) {
      p.noFill();
      p.stroke(originalStar.planetColor[0], originalStar.planetColor[1], originalStar.planetColor[2], 180 * (1 - timeline.appearance));
      p.strokeWeight(1.5);
      const rippleSize = originalStar.radius * 2 * (0.2 + timeline.appearance * 3.8);
      p.circle(star.x, star.y, rippleSize);
    }

    const alpha = timeline.alphaMultiplier;
    const glowStrength = timeline.glowMultiplier;

    p.noStroke();
    for (let i = 0; i < 5; i += 1) {
      const alphaBase = star.isBestLikes || star.isBestComments ? 18 : 12;
      p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], alphaBase * (5 - i) * 0.24 * glowStrength);
      const glowSize = star.glow * glowStrength * (1.05 + i * 0.52);
      p.ellipse(star.x, star.y, glowSize, glowSize);
    }

    if (star.rings > 0) {
      p.noFill();
      p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 50 * alpha);
      p.strokeWeight(0.6);
      for (let i = 0; i < star.rings; i += 1) {
        const rSize = star.radius * 2 + 10 + i * 7;
        p.ellipse(star.x, star.y, rSize, rSize);
      }
    }

    p.noFill();
    p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 40 * alpha);
    p.strokeWeight(0.4);
    const likeOrbitSize = star.radius * 2 + 14;
    p.ellipse(star.x, star.y, likeOrbitSize, likeOrbitSize);

    p.noStroke();
    p.textFont("Courier New");
    p.textSize(6.5);
    p.textAlign(p.CENTER, p.CENTER);
    const textAngle = -p.HALF_PI + (star.likes % 10) * 0.12;
    const tx = star.x + Math.cos(textAngle) * (likeOrbitSize * 0.5);
    const ty = star.y + Math.sin(textAngle) * (likeOrbitSize * 0.5);
    const formattedLikes = star.likes >= 1000 ? `${(star.likes / 1000).toFixed(1)}k` : `${star.likes}`;
    p.fill(3, 4, 8, 180 * alpha);
    p.rectMode(p.CENTER);
    p.rect(tx, ty, p.textWidth(formattedLikes) + 2, 7);
    p.fill(245, 235, 215, 180 * alpha);
    p.text(formattedLikes, tx, ty);

    p.push();
    p.noStroke();
    switch (star.planetType) {
      case "gas_giant":
        p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 235 * alpha);
        p.circle(star.x, star.y, star.radius * 2);
        p.stroke(star.accentColor[0], star.accentColor[1], star.accentColor[2], 200 * alpha);
        p.strokeWeight(star.radius * 0.22);
        p.line(star.x - star.radius * 0.65, star.y - star.radius * 0.3, star.x + star.radius * 0.65, star.y - star.radius * 0.3);
        p.line(star.x - star.radius * 0.78, star.y + star.radius * 0.2, star.x + star.radius * 0.78, star.y + star.radius * 0.2);
        break;
      case "ringed":
        p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 235 * alpha);
        p.circle(star.x, star.y, star.radius * 2);
        p.noFill();
        p.stroke(star.accentColor[0], star.accentColor[1], star.accentColor[2], 215 * alpha);
        p.strokeWeight(1.5);
        p.push();
        p.translate(star.x, star.y);
        p.rotate(star.ringAngle);
        p.ellipse(0, 0, star.radius * 3.8, star.radius * 0.85);
        p.pop();
        break;
      default:
        p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 235 * alpha);
        p.circle(star.x, star.y, star.radius * 2);
        p.fill(0, 0, 0, 48 * alpha);
        p.circle(star.x - star.radius * 0.35, star.y - star.radius * 0.25, star.radius * 0.38);
        p.circle(star.x + star.radius * 0.25, star.y + star.radius * 0.45, star.radius * 0.26);
        p.circle(star.x + star.radius * 0.45, star.y - star.radius * 0.35, star.radius * 0.18);
        break;
    }

    p.noStroke();
    p.fill(255, 255, 255, 235 * alpha);
    p.circle(star.x - star.radius * 0.35, star.y - star.radius * 0.35, star.radius * 0.38);

    const dotCount = Math.max(3, Math.min(24, Math.round(Math.log10(Math.max(star.likes, 1) + 1) * 6)));
    const orbitRadius = star.radius + 10 + Math.min(28, Math.log10(Math.max(star.likes, 1) + 1) * 4.2);
    p.noFill();
    p.stroke(255, 255, 255, 22 * alpha);
    p.strokeWeight(0.6);
    p.circle(star.x, star.y, orbitRadius * 2);

    p.noStroke();
    for (let d = 0; d < dotCount; d += 1) {
      const dotPhase = (d / dotCount) * p.TWO_PI + star.id.length * 0.17;
      const ox = star.x + Math.cos(dotPhase) * orbitRadius;
      const oy = star.y + Math.sin(dotPhase) * orbitRadius;
      p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 140 * alpha);
      p.circle(ox, oy, 1.2 + (d % 3) * 0.35);
    }
    p.pop();

    if (star.isBestLikes) {
      p.noFill();
      p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 72 * alpha);
      p.strokeWeight(0.9);
      p.circle(star.x, star.y, star.radius * (3.2 + timeline.freshPulse * 0.3));
    }

    if (star.isBestComments) {
      p.noFill();
      p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 60 * alpha);
      p.strokeWeight(0.5);
      for (let r = 0; r < 3; r += 1) {
        const rSize = star.radius * 3.2 + r * 15;
        p.ellipse(star.x, star.y, rSize, rSize);
      }
    }
  });

  sceneConfig.stars.forEach((star) => {
    const timeline = getNodeTimelineState(star, sceneConfig, currentTimestamp);
    if (!timeline.isVisible) return;
    const starPos = getStarPositionAtTime(star, sceneConfig, currentTimestamp);
    star.satellites.forEach((sat) => {
      const sx = starPos.x + Math.cos(sat.angleOffset) * sat.radius;
      const sy = starPos.y + Math.sin(sat.angleOffset) * sat.radius;
      p.noFill();
      p.stroke(255, 255, 255, 8 * timeline.alphaMultiplier);
      p.strokeWeight(0.4);
      p.ellipse(starPos.x, starPos.y, sat.radius * 2, sat.radius * 2);
      p.noStroke();
      p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 150 * timeline.alphaMultiplier);
      p.circle(sx, sy, sat.size);
      p.fill(255, 255, 255, 205 * timeline.alphaMultiplier);
      p.circle(sx - sat.size * 0.25, sy - sat.size * 0.25, sat.size * 0.35);
    });
  });

  // Update and draw active explosion particles
  if (anyScene.explosions && anyScene.explosions.length > 0) {
    anyScene.explosions.forEach((pt: any) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.975; // gentler drag (was 0.96) for further drifting
      pt.vy *= 0.975;
      pt.alpha -= pt.decay;
    });

    anyScene.explosions.forEach((pt: any) => {
      if (pt.alpha <= 0) return;
      p.noStroke();
      p.fill(pt.color[0], pt.color[1], pt.color[2], pt.alpha);
      p.circle(pt.x, pt.y, pt.size);
      // Small glow ring
      p.fill(pt.color[0], pt.color[1], pt.color[2], pt.alpha * 0.25);
      p.circle(pt.x, pt.y, pt.size * 2.2);
    });

    anyScene.explosions = anyScene.explosions.filter((pt: any) => pt.alpha > 0);
  }

  p.pop();
};
