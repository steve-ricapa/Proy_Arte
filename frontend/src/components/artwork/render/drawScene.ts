import p5 from "p5";
import { InstagramAnalysisPayload, SceneConfig } from "../types/artwork.types";

const getFade = (phase: number, phaseTick: number, targetPhase: number): number => {
  if (phase < targetPhase) return 0;
  if (phase > targetPhase) return 1;
  const t = phaseTick / 24.0;
  return 0.5 * (1 - Math.cos(t * Math.PI));
};

export const drawScene = (
  p: p5,
  payload: InstagramAnalysisPayload,
  sceneConfig: SceneConfig,
  phase: number,
  phaseTick: number,
  cw: number,
  ch: number
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
  const fade4 = getFade(phase, phaseTick, 4);
  const fade5 = getFade(phase, phaseTick, 5);

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

  if (fade4 > 0) {
    sceneConfig.connections.forEach((conn) => {
      const from = sceneConfig.stars[conn.fromIdx];
      const to = sceneConfig.stars[conn.toIdx];
      if (conn.type === "mention") {
        p.stroke(110, 210, 255, 48 * fade4);
        p.strokeWeight(1.2);
      } else {
        p.stroke(242, 180, 92, 25 * fade4);
        p.strokeWeight(0.5);
      }
      p.line(from.x, from.y, to.x, to.y);
    });
  }

  if (fade3 > 0) {
    sceneConfig.stars.forEach((star) => {
      p.noStroke();
      for (let i = 0; i < 5; i += 1) {
        const alphaBase = star.isBestLikes || star.isBestComments ? 18 : 12;
        p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], alphaBase * (5 - i) * 0.24 * fade3);
        const glowSize = star.glow * (1.05 + i * 0.52);
        p.ellipse(star.x, star.y, glowSize, glowSize);
      }

      if (star.rings > 0) {
        p.noFill();
        p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 50 * fade3);
        p.strokeWeight(0.6);
        for (let i = 0; i < star.rings; i += 1) {
          const rSize = star.radius * 2 + 10 + i * 7;
          p.ellipse(star.x, star.y, rSize, rSize);
        }
      }

      // ORBITAL LIKES GAUGE (Draws likes count sweeping along a dedicated orbit ring)
      p.noFill();
      p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 40 * fade3);
      p.strokeWeight(0.4);
      const likeOrbitSize = star.radius * 2 + 14;
      p.ellipse(star.x, star.y, likeOrbitSize, likeOrbitSize);
      
      p.noStroke();
      p.textFont("Courier New");
      p.textSize(6.5);
      p.textAlign(p.CENTER, p.CENTER);
      
      // Calculate a deterministic angle offset based on likes count
      const textAngle = -p.HALF_PI + (star.likes % 10) * 0.12;
      const tx = star.x + Math.cos(textAngle) * (likeOrbitSize * 0.5);
      const ty = star.y + Math.sin(textAngle) * (likeOrbitSize * 0.5);
      
      // Format likes (e.g., 1.4k if above 1000)
      const formattedLikes = star.likes >= 1000 
        ? `${(star.likes / 1000).toFixed(1)}k` 
        : `${star.likes}`;
      
      // Draw backdrop to cleanly slice the orbit line where the text resides
      p.fill(3, 4, 8);
      p.rectMode(p.CENTER);
      p.rect(tx, ty, p.textWidth(formattedLikes) + 2, 7);
      
      p.fill(245, 235, 215, 180 * fade3);
      p.text(formattedLikes, tx, ty);

      p.push();
      p.noStroke();
      switch (star.planetType) {
        case "gas_giant":
          p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 235 * fade3);
          p.circle(star.x, star.y, star.radius * 2);
          p.stroke(star.accentColor[0], star.accentColor[1], star.accentColor[2], 200 * fade3);
          p.strokeWeight(star.radius * 0.22);
          p.line(star.x - star.radius * 0.65, star.y - star.radius * 0.3, star.x + star.radius * 0.65, star.y - star.radius * 0.3);
          p.line(star.x - star.radius * 0.78, star.y + star.radius * 0.2, star.x + star.radius * 0.78, star.y + star.radius * 0.2);
          break;
        case "ringed":
          p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 235 * fade3);
          p.circle(star.x, star.y, star.radius * 2);
          p.noFill();
          p.stroke(star.accentColor[0], star.accentColor[1], star.accentColor[2], 215 * fade3);
          p.strokeWeight(1.5);
          p.push();
          p.translate(star.x, star.y);
          p.rotate(star.ringAngle);
          p.ellipse(0, 0, star.radius * 3.8, star.radius * 0.85);
          p.pop();
          break;
        case "rocky":
          p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 235 * fade3);
          p.circle(star.x, star.y, star.radius * 2);
          p.fill(0, 0, 0, 48 * fade3);
          p.circle(star.x - star.radius * 0.35, star.y - star.radius * 0.25, star.radius * 0.38);
          p.circle(star.x + star.radius * 0.25, star.y + star.radius * 0.45, star.radius * 0.26);
          p.circle(star.x + star.radius * 0.45, star.y - star.radius * 0.35, star.radius * 0.18);
          break;
        default:
          p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 235 * fade3);
          p.circle(star.x, star.y, star.radius * 2);
          p.fill(0, 0, 0, 48 * fade3);
          p.circle(star.x - star.radius * 0.35, star.y - star.radius * 0.25, star.radius * 0.38);
          p.circle(star.x + star.radius * 0.25, star.y + star.radius * 0.45, star.radius * 0.26);
          p.circle(star.x + star.radius * 0.45, star.y - star.radius * 0.35, star.radius * 0.18);
      }
      p.noStroke();
      p.fill(255, 255, 255, 235 * fade3);
      p.circle(star.x - star.radius * 0.35, star.y - star.radius * 0.35, star.radius * 0.38);

      // Orbital dots based on likes magnitude
      const dotCount = Math.max(3, Math.min(24, Math.round(Math.log10(Math.max(star.likes, 1) + 1) * 6)));
      const orbitRadius = star.radius + 10 + Math.min(28, Math.log10(Math.max(star.likes, 1) + 1) * 4.2);
      p.noFill();
      p.stroke(255, 255, 255, 26 * fade3);
      p.strokeWeight(0.6);
      p.circle(star.x, star.y, orbitRadius * 2);

      p.noStroke();
      for (let d = 0; d < dotCount; d += 1) {
        const phase = ((d / dotCount) * p.TWO_PI) + (star.id.length * 0.17);
        const ox = star.x + Math.cos(phase) * orbitRadius;
        const oy = star.y + Math.sin(phase) * orbitRadius;
        p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 150 * fade3);
        p.circle(ox, oy, 1.2 + (d % 3) * 0.35);
      }
      p.pop();

      if (star.isBestLikes) {
        // Keep emphasis for top-liked post without aggressive asterisk rays
        p.noFill();
        p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 75 * fade3);
        p.strokeWeight(0.9);
        p.circle(star.x, star.y, star.radius * 3.4);
      }

      if (star.isBestComments) {
        p.noFill();
        p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 65 * fade3);
        p.strokeWeight(0.5);
        for (let r = 0; r < 3; r += 1) {
          const rSize = star.radius * 3.2 + r * 15;
          p.ellipse(star.x, star.y, rSize, rSize);
        }
      }
    });
  }

  if (fade4 > 0) {
    sceneConfig.stars.forEach((star) => {
      star.satellites.forEach((sat) => {
        const sx = star.x + Math.cos(sat.angleOffset) * sat.radius;
        const sy = star.y + Math.sin(sat.angleOffset) * sat.radius;
        p.noFill();
        p.stroke(255, 255, 255, 9 * fade4);
        p.strokeWeight(0.4);
        p.ellipse(star.x, star.y, sat.radius * 2, sat.radius * 2);
        p.noStroke();
        p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 160 * fade4);
        p.circle(sx, sy, sat.size);
        p.fill(255, 255, 255, 210 * fade4);
        p.circle(sx - sat.size * 0.25, sy - sat.size * 0.25, sat.size * 0.35);
      });
    });
  }

  if (fade5 > 0) {
    p.stroke(245, 235, 215, 28 * fade5);
    p.strokeWeight(0.5);
    p.noFill();
    p.rect(20, 20, cw - 40, ch - 40);
    p.rect(25, 25, cw - 50, ch - 50);

    p.stroke(245, 235, 215, 75 * fade5);
    p.strokeWeight(1);
    p.line(15, 15, 30, 15);
    p.line(15, 15, 15, 30);
    p.line(cw - 15, 15, cw - 30, 15);
    p.line(cw - 15, 15, cw - 15, 30);
    p.line(15, ch - 15, 30, ch - 15);
    p.line(15, ch - 15, 15, ch - 30);
    p.line(cw - 15, ch - 15, cw - 30, ch - 15);
    p.line(cw - 15, ch - 15, cw - 15, ch - 30);

    p.noStroke();
    p.textFont("Courier New");
    p.textAlign(p.LEFT, p.TOP);
    p.fill(245, 235, 215, 150 * fade5);
    p.textSize(16);
    p.text("DIGITAL EXHIBITION SYSTEM // SPEC: IG-ANALYSIS", 45, 45);
    p.textSize(24);
    p.fill(245, 235, 215, 220 * fade5);
    p.text("ACUARELA DE CONSTELACION DIGITAL", 45, 58);

    p.textAlign(p.LEFT, p.BOTTOM);
    p.fill(245, 235, 215, 180 * fade5);
    p.textSize(18);
    p.text(`ARTIST CODE: @${payload.username || "unknown"}`, 45, ch - 62);
    p.fill(225, 210, 185, 130 * fade5);
    p.textSize(14);
    const generatedAtStr = payload.generated_at ? new Date(payload.generated_at).toLocaleString() : new Date().toLocaleString();
    p.text(`GEN TIME: ${generatedAtStr}`, 45, ch - 48);
    p.text(`SEED SYSTEM: DETERMINISTIC LAYER [${payload.render_hints?.seed || "EXHIBIT"}]`, 45, ch - 34);

    p.textAlign(p.RIGHT, p.TOP);
    p.fill(242, 180, 92, 180 * fade5);
    p.textSize(14);
    const topTags = (payload.analysis?.top_hashtags || []).slice(0, 4);
    topTags.forEach((tag, idx) => p.text(`#${tag.value || tag.hashtag || ""}`, cw - 45, 45 + idx * 14));

    p.textAlign(p.RIGHT, p.BOTTOM);
    p.fill(245, 235, 215, 160 * fade5);
    p.textSize(16);
    p.text(`CATALOGUE NO: ${sceneConfig.catalogNumber}`, cw - 45, ch - 62);
    p.fill(225, 210, 185, 110 * fade5);
    p.textSize(13.5);
    p.text(
      "SISTEMA DE EQUIVALENCIAS Y CARTOGRAFIA CELESTE:\n• TIPO PLANETA = ESTILO VISUAL\n• RADIO PLANETA = LIKES\n• AURA/ANILLOS = COMMENTS\n• ORBITA DE PUNTOS = MAGNITUD DE LIKES\n• SATELITES = MENTIONS",
      cw - 45,
      ch - 34
    );
  }

  // Hover card removed — rendered by React <HoverInfoPanel> outside canvas
};
