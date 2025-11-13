// src/Components/RunnerGame/hills.ts
import { randn, rndInt } from "./utils";
import type { MapKey } from "./config";


export function drawHillsForMap(ctx: CanvasRenderingContext2D, map: MapKey, vw: number, vh: number) {
  if (!ctx || vw <= 0 || vh <= 0) return;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;
  const hw = typeof navigator !== "undefined" ? (navigator as any).hardwareConcurrency : undefined;
  const isMobile = /Mobi|Android/i.test(ua);
  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2) || (hw && hw <= 2) || vw < 420;

    const hillPaddingX = Math.min(0.12, 0.08 + (vw < 600 ? 0.03 : 0));
  const hillLeft = vw * hillPaddingX;
  const hillRight = vw * (1 - hillPaddingX);
  const hillWidth = Math.max(1, hillRight - hillLeft);
  
  const halve = (v: number) => v * 0.5;

  // hill horizontal bounds (don't hug edges)
  const padX = Math.min(0.12, 0.08 + (vw < 600 ? 0.03 : 0));
  const left = Math.floor(vw * padX);
  const right = Math.ceil(vw * (1 - padX));
  const width = Math.max(1, right - left);

  // helper to map normalized factor to pixel Y, biased toward bottom
  const compressY = (f: number) => {
    // ensure f roughly in [0..1] but bias toward bottom (0.6..0.95)
    const v = 0.5 * f + 0.5;
    return Math.min(0.96, Math.max(0.45, v)) * vh;
  };

  // quick wrapper for tiny noise to vary parameters for stable visuals
  const n = (a: number, b: number, seed = 0) => {
    return randn(a + (b || 0), seed);
  };


  if (map === "desert") {
    const duneLayers = lowEnd ? 2 : 3;
    for (let layer = 0; layer < duneLayers; layer++) {
      const offsetFactor = 0.02 * layer;
      const topY = compressY(0.53 + offsetFactor);
      const bottomY = compressY(0.52 + offsetFactor * 0.06);
      const grad = ctx.createLinearGradient(0, topY, 0, vh);
      if (layer === duneLayers - 1) {
        grad.addColorStop(0, "#c5ae66ff");
        grad.addColorStop(1, "#b38c3eff");
      } else {
        grad.addColorStop(0, "#ebcd6dff");
        grad.addColorStop(1, "#eea24aff");
      }
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(left, bottomY);
      // 5 control points across width
      const segs = 5;
      for (let s = 0; s <= segs; s++) {
        const px = left + (s / segs) * width;
        // small noise to vary curvature
        const wob = (n(s, layer) - 0.5) * (20 + layer * 8);
        const py = topY + Math.abs(Math.cos(s * 0.9 + layer)) * (24 + layer * 8) + wob;
        const midX = Math.max(left, px - width / segs * 0.45);
        const midY = (py + bottomY) * 0.5;
        ctx.quadraticCurveTo(midX, midY, px, py);
      }
      ctx.lineTo(right, vh);
      ctx.lineTo(left, vh);
      ctx.closePath();
      ctx.fill();

      // subtle ripple strokes (cheap)
      if (!lowEnd && layer === 0) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = "#d7b77a";
        ctx.lineWidth = 1;
        for (let r = 0; r < 18; r++) {
          const sx = left + (r * 37 + n(r, layer) * 40) % width;
          const sy = topY + (n(r, 7) * 48);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(sx + 8, sy - 6 + n(r, 3) * 8, sx + 24, sy - 2 + Math.sin(r) * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // draw a few sparse cacti/rocks along the dune ridge (cheap shapes)
    const propCount = lowEnd ? 2 : 5;
    for (let p = 0; p < propCount; p++) {
      const px = left + width * (0.08 + n(p, 3) * 0.84);
      const py = compressY(0.62 + n(p, 4) * 0.08);
      // decide cactus or rock
      if (n(p, 9) > 0.35) {
        // small cactus
        const h = 28 + Math.round(n(p, 12) * 36);
        const w = Math.max(8, Math.round(h * 0.28));
        ctx.save();
        ctx.fillStyle = "#6aa04a";
        ctx.strokeStyle = "rgba(45,100,32,0.85)";
        roundRect(ctx, px - w / 2, py - h, w, h, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        // rock
        const rx = Math.max(3, 6 + Math.round(n(p, 11) * 12));
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = "#a68f72";
        ctx.beginPath();
        ctx.ellipse(px, py - rx * 0.4, rx, rx * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    return;
  }

  // ---------- ARCTIC: soft icy drifts, snow caps, spruce silhouettes ----------
  if (map === "arctic") {
    const driftLayers = lowEnd ? 2 : 3;
    for (let layer = 0; layer < driftLayers; layer++) {
      const topY = compressY(0.55 + layer * 0.06);
      const bottomY = compressY(0.40 + layer * 0.04);
      const iceGrad = ctx.createLinearGradient(0, topY, 0, vh);
      iceGrad.addColorStop(0, layer === 0 ? "#f8fdff" : "#eef8ff");
      iceGrad.addColorStop(1, "#d3e8f7");
      ctx.fillStyle = iceGrad;

      ctx.beginPath();
      ctx.moveTo(left, bottomY);
      const segs = 6;
      for (let s = 0; s <= segs; s++) {
        const px = left + (s / segs) * width;
        const wob = (n(s, layer) - 0.5) * 12;
        const py = topY + Math.abs(Math.cos(s * 0.8)) * (18 + layer * 10) + wob;
        const midX = Math.max(left, px - width / segs * 0.5);
        const midY = (py + bottomY) * 0.5;
        ctx.quadraticCurveTo(midX, midY, px, py);
      }
      ctx.lineTo(right, vh);
      ctx.lineTo(left, vh);
      ctx.closePath();
      ctx.fill();

      // frost speckles (small count)
      if (!lowEnd) {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.globalAlpha = 0.08 + layer * 0.02;
        const count = 8 - layer * 2;
        for (let i = 0; i < count; i++) {
          const sx = left + width * (0.06 + n(i, layer + 7) * 0.88);
          const sy = topY + n(i, 3) * (vh * 0.25);
          ctx.beginPath();
          ctx.ellipse(sx, sy, 1.2 + n(i, 5) * 2.6, 0.7 + n(i, 2) * 1.8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // small spruce silhouettes on nearer ridge for depth
    const spruceCount = lowEnd ? 3 : 7;
    for (let i = 0; i < spruceCount; i++) {
      const sx = left + width * (0.06 + n(i, 5) * 0.88);
      const baseY = compressY(0.48 + n(i, 6) * 0.18);
      const h = 18 + Math.round(n(i, 11) * 36);
      drawSimpleSpruce(ctx, sx, baseY, h, lowEnd);
    }

    return;
  }

  if (map === "bangu") {
    // layered urban silhouettes to create depth
    for (let layer = 0; layer < 3; layer++) {
      const depthFactor = 1 - layer * 0.18; // farther layers get compressed & darker
      const topFactor = compressY(0.12 + layer * 0.08);
      const grad = ctx.createLinearGradient(0, vh * topFactor, 0, vh);
      if (layer === 0) {
        grad.addColorStop(0, "#3e2f2b");
        grad.addColorStop(1, "#2e2320");
      } else if (layer === 1) {
        grad.addColorStop(0, "#5a4842");
        grad.addColorStop(1, "#3a2c29");
      } else {
        grad.addColorStop(0, "#7a6a64");
        grad.addColorStop(1, "#50433f");
      }
      ctx.fillStyle = grad;

      // generate a jagged skyline path: mix of low stalls and taller poles
      ctx.beginPath();
      const segments = 7 + layer * 4;
      for (let s = 0; s <= segments; s++) {
        const px = hillLeft + (s / segments) * hillWidth;
        // vary heights: stalls (short) and denser taller shapes
        const base = vh * compressY(0.62 - layer * 0.02);
        const variance = Math.max(18, vh * 0.04 * depthFactor);
        const py = base - Math.abs(Math.cos((s + layer) * 0.8)) * variance - (randn(s, layer) * variance * 0.75);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineTo(hillRight, vh);
      ctx.lineTo(hillLeft, vh);
      ctx.closePath();
      ctx.fill();

      // small windows / stalls on nearer layers
      if (layer === 0) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        for (let i = 0; i < 18; i++) {
          const wx = hillLeft + randn(i, layer) * hillWidth * 0.95;
          const wy = vh * compressY(0.56) - randn(i, 9) * 26;
          const ww = 6 + Math.floor(randn(i, 2) * 12);
          const wh = 6 + Math.floor(randn(i, 3) * 8);
          ctx.fillStyle = "#e6cf9a";
          ctx.fillRect(wx, wy, ww, wh);
        }
        ctx.restore();
      }

      // add poles and banners on the frontmost layer
      if (layer === 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0,0.45)";
        ctx.lineWidth = 1;
        for (let p = 0; p < 6; p++) {
          const px = hillLeft + (p / 6) * hillWidth + randn(p, 2) * 40;
          const topY = vh * compressY(0.50) - randn(p, 5) * 20;
          ctx.beginPath();
          ctx.moveTo(px, topY + 24);
          ctx.lineTo(px, topY - 14 - Math.floor(randn(p, 4) * 36));
          ctx.stroke();
          // string banners
          ctx.beginPath();
          ctx.moveTo(px - 12, topY - 6);
          ctx.quadraticCurveTo(px, topY - 10 - randn(p, 6) * 6, px + 12, topY - 6);
          ctx.fillStyle = "#6b3d2f";
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // foreground: a soft dust layer to integrate with ground tile
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#c8b2a0";
    ctx.beginPath();
    ctx.ellipse(hillLeft + hillWidth * 0.5, vh * 0.82, hillWidth * 0.44, vh * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return;
  }


  if (map === "haunted") {
    const bandTop = compressY(0.62);
    // silhouette layer (back)
    for (let layer = 0; layer < 2; layer++) {
      const dark = layer ? "#27282b" : "#1b1d20";
      ctx.save();
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(left, bandTop + layer * 6);
      // keyed jagged points across width
      const segs = 9;
      for (let s = 0; s <= segs; s++) {
        const px = left + (s / segs) * width;
        const jitter = (n(s * 7 + layer, s) - 0.5) * 28;
        const py = bandTop - Math.abs(Math.cos(s * 0.8 + layer)) * (36 + layer * 18) + jitter;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(right, vh);
      ctx.lineTo(left, vh);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // fog overlay (cheap gradient)
    ctx.save();
    ctx.globalAlpha = 0.11;
    const fogGrad = ctx.createLinearGradient(0, bandTop - 20, 0, vh);
    fogGrad.addColorStop(0, "rgba(200,200,215,0.12)");
    fogGrad.addColorStop(1, "rgba(40,40,45,0.0)");
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, bandTop - 80, vw, vh - (bandTop - 80));
    ctx.restore();

    // a few tombstones / props
    const tombCount = lowEnd ? 2 : 5;
    for (let tIdx = 0; tIdx < tombCount; tIdx++) {
      const tx = left + width * (0.06 + n(tIdx, 2) * 0.88);
      const ty = compressY(0.66 + n(tIdx, 5) * 0.12);
      drawTombstone(ctx, tx, ty);
    }

    return;
  }

  // ---------------------------
// DENSE FOREST hills
// ---------------------------
else if (map === "forest") {
  // forest hillforms: big mossy rocks, dense shrubs, mushrooms, small trees/saplings
    const turfTop = compressY(0.62);
  const turfMid = compressY(0.78);

  const layerCount = lowEnd ? 2 : 3;
  for (let layer = 0; layer < layerCount; layer++) {
    const topY = compressY(0.56 + layer * 0.04);
    const bottomY = compressY(0.46 + layer * 0.02);
    const grad = ctx.createLinearGradient(0, topY, 0, vh);
    if (layer === 0) {
      grad.addColorStop(0, "#8ecb79");
      grad.addColorStop(1, "#3e7a36");
    } else {
      grad.addColorStop(0, "#6aa75a");
      grad.addColorStop(1, "#2f5e2c");
    }
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(left, bottomY);
    const segs = 6;
    for (let s = 0; s <= segs; s++) {
      const px = left + (s / segs) * width;
      const wob = (n(s, layer) - 0.5) * (18 + layer * 6);
      const py = topY + Math.abs(Math.cos(s * 0.8 + layer)) * (18 + layer * 12) + wob;
      const midX = Math.max(left, px - width / segs * 0.45);
      const midY = (py + bottomY) * 0.5;
      ctx.quadraticCurveTo(midX, midY, px, py);
    }
    ctx.lineTo(right, vh);
    ctx.lineTo(left, vh);
    ctx.closePath();
    ctx.fill();

    // faint moss streaks for front-most layer
    if (!lowEnd && layer === 0) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#244f28";
      for (let m = 0; m < 10; m++) {
        const mx = left + (m / 10) * width + n(m, layer) * 24;
        const my = topY + n(m, 3) * (vh * 0.12);
        ctx.beginPath();
        ctx.ellipse(mx, my, 12 + n(m, 5) * 18, 4 + n(m, 7) * 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // big mossy boulders along ridge
  const rockCount = lowEnd ? 4 : 10;
  for (let r = 0; r < rockCount; r++) {
    const rx = left + n(r, 11) * width;
    const ry = compressY(0.52 + n(r, 7) * 0.08);
    const rw = Math.max(10, 8 + Math.floor(n(r, 3) * 36));
    const rh = Math.max(6, Math.floor(rw * (0.6 + n(r, 9) * 0.4)));

    // shadow
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#0f0f0f";
    ctx.beginPath();
    ctx.ellipse(rx + rw * 0.06, ry + rh * 0.42, rw * 0.9, rh * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // rock body
    ctx.fillStyle = `rgba(${80 + Math.floor(n(r, 2) * 40)},${70 + Math.floor(n(r, 4) * 40)},${60 + Math.floor(n(r, 6) * 40)},0.96)`;
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, (n(r, 5) - 0.5) * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // moss cap
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#2f5b2b";
    ctx.beginPath();
    ctx.ellipse(rx - rw * 0.06, ry - rh * 0.18, rw * 0.9, rh * 0.36, 0, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  }

  // fallen logs & roots (foreground)
  for (let l = 0; l < (lowEnd ? 3 : 8); l++) {
    if (Math.random() < 0.6) {
      const lx = left + n(l, 13) * width;
      const ly = compressY(0.66 + n(l, 4) * 0.08);
      const lw = rndInt ? rndInt(18, 44) : (18 + Math.floor(n(l, 17) * 26));
      const lh = Math.max(4, Math.floor(2 + n(l, 6) * 8));
      ctx.save();
      ctx.fillStyle = "#6b412d";
      ctx.fillRect(lx, ly, lw, lh);
      // rings
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#a07350";
      ctx.fillRect(lx + 4, ly + 1, Math.max(6, Math.floor(lw * 0.36)), 1);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // mushrooms clusters
  const mushCount = lowEnd ? 6 : 18;
  for (let m = 0; m < mushCount; m++) {
    if (Math.random() < 0.7) {
      const mx = left + n(m, 21) * width;
      const my = turfTop + n(m, 5) * (turfMid - turfTop) * 0.6;
      const mr = Math.max(2, 2 + Math.floor(n(m, 9) * 4));
      ctx.save();
      ctx.globalAlpha = 0.95;
      const cap = (m % 3 === 0) ? "#c83b3b" : (m % 3 === 1 ? "#ff9a5a" : "#b85a7a");
      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.arc(mx, my, mr, Math.PI, 0, true);
      ctx.fill();
      // stem
      ctx.fillStyle = "#f2e6d0";
      ctx.fillRect(mx - Math.max(0.5, mr * 0.12), my, Math.max(1, mr * 0.4), Math.max(4, mr * 1.6));
      ctx.restore();
    }
  }

  // dense shrubs & tufts
  ctx.save();
  for (let sI = 0; sI < (lowEnd ? 18 : 56); sI++) {
    if (Math.random() < 0.7) {
      const sx = left + n(sI, 19) * width;
      const sy = turfMid - Math.max(4, Math.floor(n(sI, 13) * 12));
      ctx.beginPath();
      ctx.ellipse(sx, sy, 6 + n(sI, 3) * 18, 3 + n(sI, 7) * 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = (sI % 4 === 0) ? "#1f4b23" : "#2b6a34";
      ctx.fill();
    }
  }
  ctx.restore();

  // small saplings / tiny trees sprinkled on the nearer ridge
  const sapCount = lowEnd ? 3 : 10;
  for (let st = 0; st < sapCount; st++) {
    const sx = left + n(st, 27) * width;
    const baseY = compressY(0.52 + n(st, 31) * 0.12);
    const h = 12 + Math.round(n(st, 11) * 26);
    // simple broadleaf: trunk + layered circles
    ctx.save();
    // trunk
    ctx.fillStyle = "#5a3a28";
    ctx.fillRect(sx - 1.5, baseY - h, 3, h);
    // canopy
    ctx.beginPath();
    ctx.fillStyle = "#2f6b36";
    ctx.ellipse(sx, baseY - h - 6, 14 * (h / 30), 10 * (h / 30), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#3fa049";
    ctx.ellipse(sx + 6, baseY - h - 10, 10 * (h / 30), 8 * (h / 30), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}


// ---------------------------
// BEACH hills
// ---------------------------
else if (map === "beach") {
  // beach hillforms: low sandbars, rock outcrops, driftwood, beach grass
  const duneLayers = lowEnd ? 2 : 3;
  for (let layer = 0; layer < duneLayers; layer++) {
    const topY = compressY(0.54 + layer * 0.03);
    const bottomY = compressY(0.48 + layer * 0.01);
    const duneGrad = ctx.createLinearGradient(0, topY, 0, vh);
    duneGrad.addColorStop(0, layer === 0 ? "#fff9ea" : "#f1e2b8");
    duneGrad.addColorStop(1, "#e0bf8a");
    ctx.fillStyle = duneGrad;

    ctx.beginPath();
    ctx.moveTo(left, bottomY);
    const segs = 6;
    for (let s = 0; s <= segs; s++) {
      const px = left + (s / segs) * width;
      const wob = (n(s, layer) - 0.5) * (12 + layer * 8);
      const py = topY + Math.abs(Math.cos(s * 0.7 + layer)) * (14 + layer * 10) + wob;
      const midX = Math.max(left, px - width / segs * 0.45);
      const midY = (py + bottomY) * 0.5;
      ctx.quadraticCurveTo(midX, midY, px, py);
    }
    ctx.lineTo(right, vh);
    ctx.lineTo(left, vh);
    ctx.closePath();
    ctx.fill();

    // ripple highlights on front dune
    if (!lowEnd && layer === 0) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      for (let r = 0; r < 14; r++) {
        const sx = left + (r * 33 + n(r, 2) * 36) % width;
        const sy = topY + n(r, 7) * 28;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + 12, sy - 6 + n(r, 3) * 8, sx + 34, sy - 2 + Math.sin(r) * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // scattered shells & pebbles on near ridge
  const shellCount = lowEnd ? 30 : 90;
  for (let i = 0; i < shellCount; i++) {
    const sx = left + n(i, 5) * width;
    const sy = compressY(0.62 + n(i, 8) * 0.06);
    const sw = 1 + Math.floor(n(i, 3) * 3);
    ctx.save();
    ctx.fillStyle = (i % 3 === 0) ? "#f6e7d1" : (i % 3 === 1 ? "#d9cdb0" : "#cbbba0");
    ctx.beginPath();
    ctx.ellipse(sx, sy, sw, sw * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // driftwood pieces
  for (let d = 0; d < (lowEnd ? 2 : 8); d++) {
    if (Math.random() < 0.7) {
      const dx = left + n(d, 11) * width;
      const dy = compressY(0.6 + n(d, 3) * 0.05);
      const dw = 10 + Math.floor(n(d, 7) * 48);
      const dh = Math.max(3, Math.floor(2 + n(d, 9) * 6));
      ctx.save();
      ctx.fillStyle = "#9e7956";
      ctx.fillRect(dx, dy, dw, dh);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#d7bda0";
      ctx.fillRect(dx + 3, dy + 1, Math.min(12, Math.floor(dw * 0.5)), 1);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // small rocky outcrops (near waterline)
  const rockCount = lowEnd ? 2 : 6;
  for (let r = 0; r < rockCount; r++) {
    const rx = left + n(r, 13) * width;
    const ry = compressY(0.58 + n(r, 4) * 0.06);
    const rr = 6 + Math.floor(n(r, 6) * 22);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#7f7063";
    ctx.beginPath();
    ctx.ellipse(rx, ry, rr, rr * 0.6, (n(r, 9) - 0.5) * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // beach grass / sea oats (thin curving blades)
  ctx.save();
  ctx.strokeStyle = "#2e7a45";
  ctx.lineWidth = 1;
  for (let gI = 0; gI < (lowEnd ? 12 : 36); gI++) {
    if (Math.random() < 0.6) {
      const gx = left + n(gI, 21) * width;
      const gy = compressY(0.6 + n(gI, 2) * 0.04);
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      const cx = gx + (n(gI, 5) - 0.5) * 10;
      const cy = gy - (8 + n(gI, 7) * 20);
      ctx.quadraticCurveTo(cx, cy, gx + (n(gI, 11) - 0.5) * 8, gy - 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // faint foam streaks overlay near the topmost dune
  if (!lowEnd) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    for (let f = 0; f < 6; f++) {
      const fx = left + n(f, 3) * width;
      const fy = compressY(0.52 + n(f, 6) * 0.06);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(fx + 14 + n(f, 4) * 28, fy + 6 + n(f, 8) * 16, fx + 40 + n(f, 9) * 60, fy + n(f, 11) * 6);
      ctx.stroke();
    }
    ctx.restore();
  }
}


  



  function drawSimpleSpruce(ctx: CanvasRenderingContext2D, cx: number, baseY: number, height: number, low: boolean) {
    const h = Math.max(12, height);
    const w = Math.max(8, Math.round(h * 0.5));
    ctx.save();
    // trunk
    ctx.fillStyle = "#4a3325";
    ctx.fillRect(cx - 1.5, baseY - 4, 3, 6);
    // 3 triangular layers
    const layers = low ? 2 : 3;
    for (let L = 0; L < layers; L++) {
      const hh = h - L * (h * 0.28);
      ctx.beginPath();
      ctx.moveTo(cx, baseY - hh);
      ctx.lineTo(cx - w - L * 4, baseY - hh + (h * 0.34));
      ctx.lineTo(cx + w + L * 4, baseY - hh + (h * 0.34));
      ctx.closePath();
      ctx.fillStyle = L === 0 ? "#2f6f39" : L === 1 ? "#3e8b46" : "#79c27a";
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTombstone(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.fillStyle = "rgba(90,90,100,0.92)";
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x - 8, y - 22);
    ctx.arcTo(x - 8, y - 32, x + 8, y - 32, 8);
    ctx.lineTo(x + 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#000";
    ctx.fillRect(x - 8, y - 8, 16, 2);
    ctx.restore();
  }

  function drawTinyFlower(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb84d";
    ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
    ctx.restore();
  }
}

/** small roundRect helper used by cactus drawing (kept here to avoid import issues) */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const min = Math.min(w, h) / 2;
  const rad = Math.max(0, Math.min(r, min));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
