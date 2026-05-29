import p5 from "p5";
import { InstagramAnalysisPayload, SceneConfig, StarNode } from "../types/artwork.types";

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
  ch: number,
  hoveredNode: StarNode | null
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
      for (let i = 0; i < 4; i += 1) {
        p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 12 * (4 - i) * 0.25 * fade3);
        const glowSize = star.glow * (1 + i * 0.45);
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
          p.fill(255, 255, 255, 240 * fade3);
          p.circle(star.x, star.y, star.radius * 2);
          p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2], 180 * fade3);
          p.circle(star.x, star.y, star.radius * 1.5);
      }
      p.noStroke();
      p.fill(255, 255, 255, 235 * fade3);
      p.circle(star.x - star.radius * 0.35, star.y - star.radius * 0.35, star.radius * 0.38);
      p.pop();

      if (star.isBestLikes) {
        p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 150 * fade3);
        p.strokeWeight(0.8);
        p.line(star.x, star.y - star.radius * 7, star.x, star.y + star.radius * 7);
        p.line(star.x - star.radius * 7, star.y, star.x + star.radius * 7, star.y);
        p.stroke(255, 250, 240, 70 * fade3);
        p.line(star.x - star.radius * 3.8, star.y - star.radius * 3.8, star.x + star.radius * 3.8, star.y + star.radius * 3.8);
        p.line(star.x - star.radius * 3.8, star.y + star.radius * 3.8, star.x + star.radius * 3.8, star.y - star.radius * 3.8);
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
    p.textSize(8);
    p.text("DIGITAL EXHIBITION SYSTEM // SPEC: IG-ANALYSIS", 45, 45);
    p.textSize(12);
    p.fill(245, 235, 215, 220 * fade5);
    p.text("ACUARELA DE CONSTELACION DIGITAL", 45, 58);

    p.textAlign(p.LEFT, p.BOTTOM);
    p.fill(245, 235, 215, 180 * fade5);
    p.textSize(10);
    p.text(`ARTIST CODE: @${payload.username || "unknown"}`, 45, ch - 62);
    p.fill(225, 210, 185, 130 * fade5);
    p.textSize(8);
    const generatedAtStr = payload.generated_at ? new Date(payload.generated_at).toLocaleString() : new Date().toLocaleString();
    p.text(`GEN TIME: ${generatedAtStr}`, 45, ch - 48);
    p.text(`SEED SYSTEM: DETERMINISTIC LAYER [${payload.render_hints?.seed || "EXHIBIT"}]`, 45, ch - 34);

    p.textAlign(p.RIGHT, p.TOP);
    p.fill(242, 180, 92, 180 * fade5);
    p.textSize(8);
    const topTags = (payload.analysis?.top_hashtags || []).slice(0, 4);
    topTags.forEach((tag, idx) => p.text(`#${tag.value || tag.hashtag || ""}`, cw - 45, 45 + idx * 14));

    p.textAlign(p.RIGHT, p.BOTTOM);
    p.fill(245, 235, 215, 160 * fade5);
    p.textSize(9);
    p.text(`CATALOGUE NO: ${sceneConfig.catalogNumber}`, cw - 45, ch - 62);
    p.fill(225, 210, 185, 110 * fade5);
    p.textSize(7.5);
    p.text("MAP KEY:\n• STAR TYPE   = PLANETARY BODY\n• STAR RADIUS = LIKES INFLUENCE\n• SATELLITES  = INDIVIDUAL MENTIONS", cw - 45, ch - 34);
  }

  if (phase >= 5 && hoveredNode) {
    const star = hoveredNode;
    const post = star.post;
    p.stroke(255, 255, 255, 165);
    p.strokeWeight(0.6);
    const isRight = star.x > cw / 2;
    const isBottom = star.y > ch / 2;
    const px = star.x + (isRight ? -45 : 45);
    const py = star.y + (isBottom ? -45 : 45);
    p.line(star.x, star.y, px, py);
    p.line(px, py, px + (isRight ? -130 : 130), py);

    const cardX = px + (isRight ? -135 : 5);
    const cardY = py - 35;
    const cardW = 130;
    const cardH = 75;
    p.noStroke();
    p.fill(5, 7, 18, 225);
    p.rect(cardX, cardY, cardW, cardH, 4);
    p.stroke(255, 255, 255, 40);
    p.strokeWeight(0.8);
    p.noFill();
    p.rect(cardX, cardY, cardW, cardH, 4);
    p.stroke(star.planetColor[0], star.planetColor[1], star.planetColor[2], 220);
    p.strokeWeight(1.8);
    p.line(cardX, cardY, cardX, cardY + 8);
    p.line(cardX, cardY, cardX + 8, cardY);
    p.noStroke();
    p.textFont("Courier New");
    p.textSize(8);
    p.textAlign(p.LEFT, p.TOP);
    p.fill(170, 190, 220);
    const postDate = post.timestamp ? post.timestamp.split("T")[0] : "N/A";
    p.text(`PLANET:  ${star.planetType.toUpperCase()}`, cardX + 6, cardY + 8);
    p.text(`DATE:    ${postDate}`, cardX + 6, cardY + 20);
    p.fill(255, 255, 255);
    p.text(`LIKES:   ${star.likes}`, cardX + 6, cardY + 34);
    p.text(`COMMENTS:${star.comments}`, cardX + 6, cardY + 46);
    p.fill(star.planetColor[0], star.planetColor[1], star.planetColor[2]);
    const hTags = (post.hashtags || []).slice(0, 1).map((h) => `#${h}`).join("");
    const mMents = (post.mentions || []).slice(0, 1).map((m) => `@${m}`).join("");
    p.text(`${hTags} ${mMents}`.substring(0, 24), cardX + 6, cardY + 58);
  }
};
