import type { Shield } from "./types";
import { buildSmoothPath2D, mulberry32, randn, rndInt } from "./utils";
import type { Particle } from "./particles";
// removed unused imports: clamp, HERO_PROTECTED_RADIUS, HERO_OFFSET

export function drawAnchoredShield(ctx: CanvasRenderingContext2D, s: Shield) {
  if (!s.points || s.points.length < 2) return;
  const path = buildSmoothPath2D(s.points);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const ratio = Math.max(0, s.durability / s.maxDurability);
  const baseColor = ratio > 0.45 ? "#46a3ff" : "#9b9b9b";

  // 1) soft drop-shadow to ground (gives weight)
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.61)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;
  ctx.lineWidth = Math.max(2, Math.round(s.thickness * 0.5));
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.globalAlpha = 0.9;
  ctx.stroke(path);
  ctx.restore();

  // 2) subtle crushed ground depression along the lower curve
  // draw a soft multiplied band under the path to simulate compression
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.22;
  const depressGrad = ctx.createLinearGradient(0, 0, 0, 18);
  depressGrad.addColorStop(0, "rgba(40,32,28,0.28)");
  depressGrad.addColorStop(1, "rgba(12,10,8,0.02)");
  ctx.strokeStyle = depressGrad;
  ctx.lineWidth = Math.max(6, Math.round(s.thickness * 0.9));
  ctx.stroke(path);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  // 3) primary luminous strokes (keeps original look)
  ctx.setLineDash([10, 6]);
  ctx.lineWidth = Math.max(3, Math.round(s.thickness * 0.35));
  ctx.strokeStyle = baseColor;
  ctx.globalAlpha = 0.98;
  ctx.stroke(path);

  ctx.setLineDash([14, 8]);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = ratio > 0.45 ? "#002b66" : "#303030";
  ctx.globalAlpha = 0.86;
  ctx.stroke(path);

  ctx.setLineDash([2, 12]);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.globalAlpha = 0.72;
  ctx.stroke(path);

  // 4) micro-damage / cracks when low durability (preserve behaviour)
  if (ratio < 0.75) {
    const crackIntensity = Math.floor((1 - ratio) * 6);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.globalAlpha = 0.96;
    const rnd = mulberry32(Math.floor(s.createdAt));
    for (let i = 0; i < crackIntensity; i++) {
      const idx = Math.floor(rnd() * (s.points.length - 1));
      const p = s.points[idx];
      const ang = rnd() * Math.PI * 2;
      const len = 3 + rnd() * 10;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len);
      ctx.stroke();
    }
  }

  // 5) grounded stakes + realistic attachment detail
  // find lower Y to choose where to place stakes / mounds
  let bottomY = -Infinity;
  for (const p of s.points) if (p.y > bottomY) bottomY = p.y;

  // deterministic RNG per-shield so stakes placement is stable
  const rnd = mulberry32(Math.floor(s.createdAt));
  const stakeCount = Math.min(6, Math.max(2, Math.floor(s.points.length / 4)));

  for (let i = 0; i < stakeCount; i++) {
    // choose index along points (spread evenly, jittered)
    const t = i / (Math.max(1, stakeCount - 1));
    const idxBase = Math.floor(t * (s.points.length - 1));
    const jitter = Math.floor((rnd() - 0.5) * 3);
    const idx = Math.min(s.points.length - 1, Math.max(0, idxBase + jitter));
    const p = s.points[idx];

    // draw only near bottom edge — skip stakes that are high up
    if (p.y < bottomY - 12) continue;

    // A) dirt mound (soft radial gradient)
    ctx.save();
    const moundW = 6 + Math.round(s.thickness * (0.9 + rnd() * 0.8));
    const moundH = Math.max(3, Math.round(moundW * 0.42));
    const mg = ctx.createRadialGradient(p.x, p.y + moundH * 0.35, 1, p.x, p.y + moundH * 0.35, moundW * 0.8);
    mg.addColorStop(0, "rgba(70,52,33,0.95)");
    mg.addColorStop(0.45, "rgba(92,64,42,0.96)");
    mg.addColorStop(1, "rgba(42,30,22,0)");
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + moundH * 0.5, moundW, moundH, 0, 0, Math.PI * 2);
    ctx.fill();

    // a few soil specks on top
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "rgba(20,16,12,0.98)";
    for (let sidx = 0; sidx < 3; sidx++) {
      const sx = p.x + (rnd() - 0.5) * moundW * 0.9;
      const sy = p.y + (rnd() - 0.5) * moundH * 0.4;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 0.8 + rnd() * 1.6, 0.6 + rnd() * 1.2, rnd() - 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // B) main stake body: a slightly tapered metal spike
    ctx.save();
    const stakeW = Math.max(3, Math.round(s.thickness * (0.4 + rnd() * 0.9)));
    const stakeH = Math.max(8, Math.round(6 + s.thickness * (0.8 + rnd() * 1.6)));
    // stake shadow
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "rgba(12, 12, 12, 0.55)";
    ctx.beginPath();
    ctx.moveTo(p.x - stakeW / 2, p.y + 2);
    ctx.lineTo(p.x, p.y + 2 + stakeH);
    ctx.lineTo(p.x + stakeW / 2, p.y + 2);
    ctx.closePath();
    ctx.fill();

    // metallic front (slightly beveled)
    ctx.beginPath();
    const metalGrad = ctx.createLinearGradient(p.x - stakeW * 0.5, p.y, p.x + stakeW * 0.5, p.y);
    metalGrad.addColorStop(0, "#3f3f45");
    metalGrad.addColorStop(0.5, "#7b7b82");
    metalGrad.addColorStop(1, "#2d2d2f");
    ctx.fillStyle = metalGrad;
    ctx.translate(p.x, p.y + 2);
    ctx.rotate((rnd() - 0.5) * 0.28);
    ctx.beginPath();
    ctx.moveTo(-stakeW / 2, 0);
    ctx.lineTo(0, stakeH);
    ctx.lineTo(stakeW / 2, 0);
    ctx.closePath();
    ctx.fill();

    // small head/cap
    ctx.setTransform(1,0,0,1,0,0);  
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#2e2b28";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 1.6, stakeW * 0.9, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.9;
    const timePhase = ((Date.now() - s.createdAt) % 1200) / 1200; 
    const glintX = p.x - stakeW * 0.3 + Math.sin(timePhase * Math.PI * 2) * (stakeW * 0.36);
    ctx.fillStyle = `rgba(255,255,255,${0.12 + (0.08 * Math.abs(Math.cos(timePhase * Math.PI * 2)))})`;
    ctx.beginPath();
    ctx.ellipse(glintX, p.y + 0.6, stakeW * 0.28, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // C) small strap / clamp connecting stake to shield path (visual tie)
    // draw a short curved strap that appears to wrap the shield edge down to stake
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(60,50,44,0.94)";
    ctx.beginPath();
    const targetX = p.x + (rnd() - 0.5) * 8;
    const targetY = p.y - (2 + Math.round(rnd()*6));
    ctx.moveTo(targetX, targetY);
    ctx.quadraticCurveTo((targetX + p.x) * 0.5 + (rnd()-0.5)*6, targetY + 6 + rnd()*4, p.x + (rnd()-0.5)*2, p.y + 2);
    ctx.stroke();
    ctx.restore();

    // D) a couple of pebbles around stake for extra realism
    ctx.save();
    ctx.globalAlpha = 0.95;
    for (let pe = 0; pe < 3; pe++) {
      const px = p.x + (rnd() - 0.5) * (moundW + 6);
      const py = p.y + moundH * 0.6 + Math.abs((rnd() - 0.5) * 6);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${80 + Math.floor(rnd()*80)},${70 + Math.floor(rnd()*60)},${60 + Math.floor(rnd()*40)},0.96)`;
      ctx.ellipse(px, py, 1 + rnd()*2.6, 0.6 + rnd()*1.4, (rnd()-0.5)*0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } // end stakes loop

  // 6) subtle top sheen / outer glow for readability
  ctx.save();
  ctx.lineWidth = 1.0;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.globalCompositeOperation = "lighter";
  ctx.stroke(path);
  ctx.restore();

  // 7) final reset
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();
}


export function drawParticles(ctx: CanvasRenderingContext2D, arr: Particle[]) {
  for (const p of arr) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot || 0);
    const alpha = Math.max(0, Math.min(1, p.life));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
}


export function drawGroundProcedural(

  ctx: CanvasRenderingContext2D,
  rect: DOMRect,
  assets?: Record<string, any>,
  envKey?: string | null
) {
  const groundH = Math.max(Math.floor(rect.height * 0.13), 62);
  const baseY = rect.height - groundH; 
  const bottomY = rect.height;

  // Palette
  const asphaltDark = "#282828ff";
  const asphaltMid = "#636363ff";
  const patchDark = "#242424ff";
  const curbGrey = "#bdbdbd";
  const paintWhite = "rgba(240,240,235,0.95)";
  const paintFaded = "rgba(240,220,190,0.42)";
  const oil = "rgba(10,10,10,0.65)";
  const glassBlue = "rgba(140,200,255,0.85)";
  const cardboard = "#cfae86";

  const maybeGround = assets && envKey ? assets[`ground_${envKey}`] : null;
  let usedTexture = false;
  if (maybeGround && maybeGround instanceof HTMLImageElement) {
    try {
      const pattern = ctx.createPattern(maybeGround, "repeat");
      if (pattern) {
        ctx.save();
        ctx.fillStyle = pattern;
        ctx.fillRect(0, baseY, rect.width, groundH);

        ctx.globalAlpha = 0.14;
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(0, baseY + Math.floor(groundH * 0.6), rect.width, Math.floor(groundH * 0.5));
        ctx.globalAlpha = 1;
        ctx.restore();
        usedTexture = true;
      }
    } catch (err) {
      usedTexture = false;
    }
  }

  if (!usedTexture) {

  // groundH, baseY and bottomY are already defined above in this function
  const groundImg = assets && envKey ? assets[`ground_${envKey}`] as HTMLImageElement | null : null;

  if (groundImg && groundImg instanceof HTMLImageElement) {
    try {
      // try cached pattern first
      let pattern = assets ? (assets[`pattern_${envKey}`] as CanvasPattern | undefined) : undefined;
      if (!pattern) {
        pattern = ctx.createPattern(groundImg, "repeat") || undefined;
        if (pattern && assets) assets[`pattern_${envKey}`] = pattern;
      }
      if (pattern) {
        ctx.save();
        ctx.fillStyle = pattern;
        ctx.fillRect(0, baseY, rect.width, groundH);

        // subtle darker bottom fade to add weight and help overlays read
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(0, baseY + Math.floor(groundH * 0.6), rect.width, Math.floor(groundH * 0.5));
        ctx.globalAlpha = 1;
        ctx.restore();
      } else {
        // pattern creation failed — fall back to painted asphalt below
        ctx.fillStyle = asphaltMid;
        ctx.fillRect(0, baseY, rect.width, groundH);
        const baseGrad = ctx.createLinearGradient(0, baseY + groundH * 0.4, 0, bottomY);
        baseGrad.addColorStop(0, asphaltMid);
        baseGrad.addColorStop(1, asphaltDark);
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, baseY + Math.floor(groundH * 0.4), rect.width, bottomY - (baseY + Math.floor(groundH * 0.4)));
      }
    } catch (err) {
      // safe fallback if something throws
      ctx.fillStyle = asphaltMid;
      ctx.fillRect(0, baseY, rect.width, groundH);
      const baseGrad = ctx.createLinearGradient(0, baseY + groundH * 0.4, 0, bottomY);
      baseGrad.addColorStop(0, asphaltMid);
      baseGrad.addColorStop(1, asphaltDark);
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, baseY + Math.floor(groundH * 0.4), rect.width, bottomY - (baseY + Math.floor(groundH * 0.4)));
    }
  } else {
    // --- Original painted asphalt fallback (unchanged) ---
    ctx.fillStyle = asphaltMid;
    ctx.fillRect(0, baseY, rect.width, groundH);

    // subtle darker bottom row for weight
    const baseGrad = ctx.createLinearGradient(0, baseY + groundH * 0.4, 0, bottomY);
    baseGrad.addColorStop(0, asphaltMid);
    baseGrad.addColorStop(1, asphaltDark);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, baseY + Math.floor(groundH * 0.4), rect.width, bottomY - (baseY + Math.floor(groundH * 0.4)));
  }


  // --- curb hints (left/right) ---
  const curbH = Math.min(28, Math.floor(groundH * 0.34));
  const curbW = Math.max(10, Math.floor(rect.width * 0.01));
  ctx.fillStyle = curbGrey;
  ctx.fillRect(0, baseY - curbH + 6, curbW, curbH);
  ctx.fillRect(rect.width - curbW, baseY - curbH + 6, curbW, curbH);

  // --- large potholes (static, irregular) ---
  const potholeCount = Math.max(1, Math.floor(rect.width / 420));
  for (let p = 0; p < potholeCount; p++) {
    const px = Math.abs(rndInt(p * 37 + 11, rect.width - 80));
    const py = baseY + Math.floor(groundH * (0.35 + Math.abs(randn(p, 19) * 0.45)));
    const pr = 22 + Math.abs(Math.floor(randn(p, 23) * 36));
    // rim: lighter broken concrete ring
    ctx.beginPath();
    ctx.fillStyle = "#6d6b69";
    ctx.ellipse(px, py, pr + 6, (pr + 6) * 0.54, 0, 0, Math.PI * 2);
    ctx.fill();
    // dark cavity
    ctx.beginPath();
    ctx.fillStyle = "rgba(10,8,7,0.98)";
    ctx.ellipse(px, py + 2, pr, pr * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // inner wet sheen near bottom
    const innerGrad = ctx.createRadialGradient(px, py + 2, pr * 0.12, px, py + 2, pr);
    innerGrad.addColorStop(0, "rgba(40,40,40,0.85)");
    innerGrad.addColorStop(0.7, "rgba(8,8,8,0.6)");
    innerGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.ellipse(px, py + 2, pr * 0.9, pr * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- broken zebra/crosswalk fragments (offset, static) ---
  const zebraX = Math.floor(rect.width * 0.22);
  const zebraW = Math.min(160, Math.floor(rect.width * 0.18));
  const zebraY = baseY + Math.floor(groundH * 0.12);
  for (let i = 0; i < 6; i++) {
    const bx = zebraX + i * Math.floor(zebraW / 5) + Math.floor(randn(i, 9) * 6);
    const by = zebraY + Math.floor(randn(i, 7) * 6);
    const bw = Math.max(8, Math.floor((zebraW / 6) + Math.abs(randn(i, 11) * 8)));
    // faded white stripe piece
    ctx.fillStyle = (i % 2 === 0) ? paintWhite : paintFaded;
    ctx.fillRect(bx, by, bw, 6 + Math.floor(randn(i, 5) * 4));
    // chipped edge shadow
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "black";
    ctx.fillRect(bx + 2, by + (6 + Math.floor(randn(i, 5) * 4)) - 2, Math.min(bw, 12), 2);
    ctx.globalAlpha = 1;
  }

  // --- subtle wet sheen across part of the band (keeps within band) ---
  const sheenWidth = Math.min(260, Math.floor(rect.width * 0.25));
  const sheenX = Math.abs(rndInt(71, rect.width - sheenWidth));
  const sheenY = baseY + Math.floor(groundH * 0.28);
  const sheenGrad = ctx.createLinearGradient(sheenX, sheenY, sheenX + sheenWidth, sheenY + Math.floor(groundH * 0.6));
  sheenGrad.addColorStop(0, "rgba(255,255,255,0.04)");
  sheenGrad.addColorStop(0.35, "rgba(255,255,255,0.02)");
  sheenGrad.addColorStop(1, "rgba(255,255,255,0.00)");
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(sheenX, sheenY, sheenWidth, Math.floor(groundH * 0.6));

  // --- faint rail groove (two parallel shallow rails) ---
  const railY = baseY + Math.floor(groundH * 0.6);
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = "rgba(83, 83, 83, 0.9)";
  for (let r = 0; r < 2; r++) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    const startX = Math.abs(Math.floor(randn(r, 31) * 40));
    ctx.moveTo(startX, railY + r * 6);
    const len = rect.width - startX - Math.floor(randn(r, 17) * 40);
    ctx.quadraticCurveTo(startX + len * 0.45, railY + Math.floor(randn(r, 9) * 12), startX + len, railY + r * 6 + Math.floor(randn(r, 11) * 3));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // --- scattered glass shards (small triangles) ---
  for (let gix = 0; gix < Math.floor(rect.width / 40); gix++) {
    const gx = Math.abs(rndInt(gix * 19 + 7, rect.width - 6));
    const gy = baseY + Math.abs(Math.floor(randn(gix, 29) * (groundH - 6)));
    const s = 2 + Math.abs(Math.floor(randn(gix, 17) * 3));
    // draw small triangle shard
    ctx.beginPath();
    ctx.fillStyle = glassBlue;
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + s, gy + Math.floor(randn(gix, 23) * 2) + 1);
    ctx.lineTo(gx + Math.floor(randn(gix, 31) * 3) + 1, gy - s);
    ctx.closePath();
    ctx.fill();
    // tiny highlight
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "white";
    ctx.fillRect(gx - 1, gy - 1, 1, 1);
    ctx.globalAlpha = 1;
  }

  // --- cardboard / trash silhouettes ---
  const trashCount = Math.max(4, Math.floor(rect.width / 260));
  for (let t = 0; t < trashCount; t++) {
    const tx = Math.abs(rndInt(t * 13 + 3, rect.width - 28));
    const ty = baseY + Math.abs(Math.floor(randn(t, 41) * (groundH - 12)));
    if (t % 2 === 0) {
      ctx.fillStyle = cardboard;
      ctx.fillRect(tx, ty, 14 + (t % 3) * 4, 8 + Math.abs(Math.floor(randn(t, 7) * 6)));
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "black";
      ctx.fillRect(tx + 2, ty + 6, 8, 2);
      ctx.globalAlpha = 1;
    } else {
      // crushed paper bundle
      ctx.fillStyle = "rgba(210,210,200,0.95)";
      ctx.beginPath();
      ctx.ellipse(tx, ty, 6 + Math.abs(Math.floor(randn(t, 23) * 6)), 4, randn(t, 5) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- oil stains & small dark patches ---
  for (let s = 0; s < Math.max(1, Math.floor(rect.width / 360)); s++) {
    const ox = Math.abs(rndInt(s * 43 + 5, rect.width - 40));
    const oy = baseY + Math.floor(groundH * 0.55);
    const orad = 12 + Math.abs(Math.floor(randn(s, 29) * 26));
    const og = ctx.createRadialGradient(ox, oy, orad * 0.08, ox, oy, orad);
    og.addColorStop(0, "rgba(0,0,0,0.6)");
    og.addColorStop(0.5, "rgba(12,12,14,0.4)");
    og.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.ellipse(ox, oy, orad, orad * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- hairline cracks (thin, shallow) ---
  ctx.save();
  ctx.strokeStyle = "rgba(12,10,9,0.9)";
  ctx.lineWidth = 0.9;
  ctx.globalAlpha = 0.95;
  for (let c = 0; c < 12; c++) {
    const sx = Math.abs(Math.floor(randn(c, 61) * rect.width)) % rect.width;
    const sy = baseY + Math.abs(Math.floor(randn(c, 67) * Math.floor(groundH * 0.6)));
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (let k = 0; k < 3; k++) {
      const nx = sx + (k + 1) * (6 + Math.floor(randn(c, k) * 10));
      const ny = sy + Math.floor(randn(k, c) * 5);
      ctx.lineTo(nx, ny);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

}
