import p5 from "p5";

import { getNodeTimelineState } from "../timeline/temporal";
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
  currentTimestamp: number
) => {
  p.background(3, 4, 8);

  const maxR = Math.max(cw, ch);
  p.noStroke();
  for (let r = maxR; r > 0; r -= 15) {
    const alpha = p.map(r, maxR, 0, 185, 5);
    p.fill(2, 3, 6, alpha);
    p.ellipse(cw / 2, ch / 2, r * 1.35, r * 1.25);
  }

  const fade1 = getFade(phase, phaseTick, 1);
  const fade2 = getFade(phase, phaseTick, 2);
  const fade3 = getFade(phase, phaseTick, 3);

  if (fade1 > 0) {
    p.stroke(245, 235, 215, 6 * fade1);
    p.strokeWeight(0.5);
    sceneConfig.technicalGrid.forEach((line) => p.line(line.x1, line.y1, line.x2, line.y2));

    p.fill(245, 235, 215, 15 * fade1);
    p.noStroke();
    p.textFont("Courier New");
    p.textSize(8);
    for (let gx = 120; gx < cw; gx += 240) {
      for (let gy = 120; gy < ch; gy += 240) p.text("+", gx - 3, gy + 3);
    }

    p.noFill();
    p.stroke(245, 235, 215, 8 * fade1);
    p.strokeWeight(0.5);
    p.ellipse(cw / 2, ch / 2, 320, 320);

    p.stroke(245, 235, 215, 12 * fade1);
    sceneConfig.compassTicks.forEach((tick) => p.line(tick.x1, tick.y1, tick.x2, tick.y2));

    p.noStroke();
    sceneConfig.bgStars.forEach((star) => {
      p.fill(235, 245, 255, star.a * fade1);
      p.circle(star.x, star.y, star.r);
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
    return;
  }

  sceneConfig.connections.forEach((conn) => {
    const from = sceneConfig.stars[conn.fromIdx];
    const to = sceneConfig.stars[conn.toIdx];
    const fromTimeline = getNodeTimelineState(from, sceneConfig, currentTimestamp);
    const toTimeline = getNodeTimelineState(to, sceneConfig, currentTimestamp);
    if (!fromTimeline.isVisible || !toTimeline.isVisible) return;

    const lineAlpha = Math.min(fromTimeline.alphaMultiplier, toTimeline.alphaMultiplier);
    if (conn.type === "mention") {
      p.stroke(110, 210, 255, 38 * lineAlpha);
      p.strokeWeight(1.05);
    } else {
      p.stroke(242, 180, 92, 20 * lineAlpha);
      p.strokeWeight(0.5);
    }
    p.line(from.x, from.y, to.x, to.y);
  });

  sceneConfig.stars.forEach((star) => {
    const timeline = getNodeTimelineState(star, sceneConfig, currentTimestamp);
    if (!timeline.isVisible) return;

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
    star.satellites.forEach((sat) => {
      const sx = star.x + Math.cos(sat.angleOffset) * sat.radius;
      const sy = star.y + Math.sin(sat.angleOffset) * sat.radius;
      p.noFill();
      p.stroke(255, 255, 255, 8 * timeline.alphaMultiplier);
      p.strokeWeight(0.4);
      p.ellipse(star.x, star.y, sat.radius * 2, sat.radius * 2);
      p.noStroke();
      p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 150 * timeline.alphaMultiplier);
      p.circle(sx, sy, sat.size);
      p.fill(255, 255, 255, 205 * timeline.alphaMultiplier);
      p.circle(sx - sat.size * 0.25, sy - sat.size * 0.25, sat.size * 0.35);
    });
  });
};
