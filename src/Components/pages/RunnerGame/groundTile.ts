import { randn, rndInt } from "./utils";
import type { MapKey } from "./config";

let groundCache: { canvas: HTMLCanvasElement; width: number; height: number; map: MapKey } | null = null;



export function buildGroundTile(

  width: number,
  height: number,
  grassBand: number,
  map: MapKey
): HTMLCanvasElement {

  if (
    groundCache &&
    groundCache.width === Math.ceil(width) &&
    groundCache.height === Math.ceil(height) &&
    groundCache.map === map
  ) {
    return groundCache.canvas;
  }

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;

  const hw = typeof navigator !== "undefined" ? (navigator as any).hardwareConcurrency : undefined;

  const isMobile = /Mobi|Android/i.test(ua);

  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2) || (hw && hw <= 2);

    function n (a: number, b: number, seed = 0) {

    return Math.abs(Math.sin(a * 12.9898 + b * 78.233 + seed) * 43758.5453) % 1;
  }

  const c = document.createElement("canvas");
  c.width = Math.max(180, Math.floor(width));
  c.height = Math.max(120, Math.floor(height));
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = true;

  // Simple deterministic-ish pseudo-random for texture
  function randn(x: number, y: number, seed = 0) {
    return Math.abs(Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453) % 1;
  }

    
  function verticalWobble(x: number, amplitude: number, frequency = 0.014, seed = 0) {
    const sinPart = Math.sin(x * frequency + seed) * 0.6;         
    const randPart = (randn(Math.floor(x), seed) - 0.5) * 0.95;     
    return (sinPart + randPart) * amplitude;
  }


  // -------------------------
  // DESERT
  
if (map === "desert") {
  
  // quick mobile/low-end detection
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;
  const isMobile = /Mobi|Android/i.test(ua);
  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2);

  // base sand gradient (warmer top, cooler base)
  const sandGrad = g.createLinearGradient(0, 0, 0, c.height);
  sandGrad.addColorStop(0,   "#E6D6A2FF");
sandGrad.addColorStop(0.28,"#D9B677FF");
sandGrad.addColorStop(0.62,"#C99A5AFF");
sandGrad.addColorStop(1,   "#A67846FF");

  g.fillStyle = sandGrad;
  g.fillRect(0, 0, c.width, c.height);

  // Dune layers (soft, large overlapping arcs) to give depth
  g.save();
  g.globalAlpha = 0.85;
  const duneCount = lowEnd ? 2 : 3;
  for (let d = 0; d < duneCount; d++) {
    const baseY = c.height * (0.62 - d * 0.08) + randn(d, c.width) * 12;
    const amp = (c.width / (6 + d * 2)) * (0.7 + randn(d, 2) * 0.35);
    const hueOffset = d * 6;
    const duneGrad = g.createLinearGradient(0, baseY - 60, 0, baseY + 80);
    duneGrad.addColorStop(0, `rgba(${255 - hueOffset},${230 - hueOffset},${170 - hueOffset},0.95)`);
    duneGrad.addColorStop(1, `rgba(${210 - hueOffset},${175 - hueOffset},${120 - hueOffset},0.98)`);
    g.fillStyle = duneGrad;

    g.beginPath();
    g.moveTo(0, c.height);
    // smooth curve across width using fewer points
    const segs = 6;
    for (let s = 0; s <= segs; s++) {

      const px = (s / segs) * c.width;

      const wob = Math.sin((s + d) * 0.8 + (c.width % 17)) * (10 + d * 6) + randn(s, d) * 8;

       const py = baseY 
        - Math.abs(Math.cos(s * 0.9)) * (28 + d * 10) 
        + wob * 0.45 
        + verticalWobble(px, lowEnd ? 4 : 9, 0.016, d);

      const midX = px - (c.width / segs) * 0.5;
      const midY = (py + baseY) * 0.5;
      g.quadraticCurveTo(Math.max(0, midX), midY, px, py);
    }
    g.lineTo(c.width, c.height);
    g.closePath();
    g.fill();
  }
  g.restore();

  // Dune ripples (cheaper: fewer, longer strokes rather than tiny ellipses)
  const rippleCount = lowEnd ? 60 : 180;
  g.save();
  g.strokeStyle = "rgba(190,155,105,0.12)";
  g.lineWidth = lowEnd ? 1 : 1.4;
  g.globalCompositeOperation = "source-over";
  for (let i = 0; i < rippleCount; i++) {
    const x = (i * 47 + randn(i, 4) * 46) % c.width;
    const y = Math.floor(c.height * (0.55 + randn(i, 7) * 0.28));
    const len = 26 + Math.floor(randn(i, 8) * 36);
    const tilt = (randn(i, 3) - 0.5) * 0.35;
    // short curved stroke
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + len * 0.5, y - 6 - randn(i, 2) * 6, x + len, y - 2 + Math.sin(i) * 2);
    g.stroke();
  }
  g.restore();

  // Larger pebbles / stones with soft shadows
  const stoneCount = lowEnd ? 10 : 28;
  for (let i = 0; i < stoneCount; i++) {
    const sx = Math.floor(randn(i, 2) * c.width);
    const sy = Math.floor(randn(i, 13) * c.height * 0.75 + c.height * 0.18);
    const r = Math.max(2, Math.floor(3 + randn(i, 11) * 12 * (lowEnd ? 0.8 : 1)));
    // shadow
    g.globalAlpha = 0.12;
    g.fillStyle = "rgba(20,15,10,0.9)";
    g.beginPath();
    g.ellipse(sx + r * 0.08, sy + r * 0.5, r * 0.9, r * 0.36, 0, 0, Math.PI * 2);
    g.fill();
    // rock body
    g.globalAlpha = 1;
    const tone = 110 + (i % 6) * 6 + Math.floor(randn(i, sx) * 30);
    g.fillStyle = `rgba(${tone - 10},${tone - 20},${tone - 40},0.96)`;
    g.beginPath();
    g.ellipse(sx, sy, r * 0.9, r * 0.7, (randn(i, 5) - 0.5) * 0.15, 0, Math.PI * 2);
    g.fill();
    // tiny highlight
    g.globalAlpha = 0.12;
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.beginPath();
    g.ellipse(sx - r * 0.22, sy - r * 0.18, Math.max(1.2, r * 0.22), Math.max(0.6, r * 0.14), 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
  }

  // Subtle scattered fine granules (cheaper than hundreds of ellipses on phones)
  const granuleCount = lowEnd ? 40 : 140;
  g.save();
  g.fillStyle = "rgba(190,150,100,0.06)";
  for (let i = 0; i < granuleCount; i++) {
    const gx = (i * 61 + randn(i, 9) * 38) % c.width;
    const gy = (i * 37 + randn(6, i) * 28) % c.height;
    const s = 0.7 + randn(i, gx) * (lowEnd ? 0.8 : 1.6);
    g.beginPath();
    g.ellipse(gx, gy, s, s * 0.7, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // Oasis edge: small grassy oasis band with smoother transition
  const gbThin = Math.max(4, Math.floor(grassBand * 0.24));
  if (gbThin > 0) {
    const oasisGrad = g.createLinearGradient(0, 0, 0, gbThin);
    oasisGrad.addColorStop(0, "#c9e7a0");
    oasisGrad.addColorStop(0.5, "#9fd191");
    oasisGrad.addColorStop(1, "#d6c69a");
    g.fillStyle = oasisGrad;

    // soft fuzzy band instead of hard rect
    g.beginPath();
    g.moveTo(0, gbThin);
    const segsO = Math.max(5, Math.floor(c.width / 160));
    let lx = 0;

    for (let s = 0; s <= segsO; s++) {

      const px = (s / segsO) * c.width;
      const py = gbThin 
        - Math.sin(s * 0.8 + (c.width % 11)) * (2 + randn(s, 3) * 3)
        + verticalWobble(px, lowEnd ? 1.2 : 3.2, 0.02, 17)

      const midX = (lx + px) * 0.5;
      const midY = (gbThin + py) * 0.5 - 3;
      g.quadraticCurveTo(midX, midY, px, py);
      lx = px;
    }
    g.lineTo(c.width, gbThin + 8);
    g.lineTo(c.width, 0);
    g.lineTo(0, 0);
    g.closePath();
    g.fill();

    // thin dark trim for separation
    g.globalAlpha = 0.06;
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.fillRect(0, gbThin - 2, c.width, 3);
    g.globalAlpha = 1;
  }

  // Heat haze: soft translucent bands near horizon and ground, cheap
  g.save();
  g.globalAlpha = 0.085 * (lowEnd ? 0.8 : 1);
  const hazeCount = lowEnd ? 2 : 5;
  g.fillStyle = "rgba(245,225,170,0.9)";
  for (let i = 0; i < hazeCount; i++) {
    const hx = (i * 97 + randn(i, 6) * 120) % c.width;
    const hy = c.height - (12 + i * 6) + Math.sin(i * 0.6) * 2;
    const hw = Math.max(40, Math.floor(c.width * (0.06 + i * 0.02)));
    const hh = Math.max(10, Math.floor(6 + i * 2));
    g.beginPath();
    g.ellipse(hx, hy, hw, hh, (randn(i, 3) - 0.5) * 0.12, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // subtle warm vignette at bottom to ground scene (cheap)
  g.save();
  g.globalAlpha = 0.06;
  g.fillStyle = "rgba(200,150,100,0.9)";
  g.fillRect(0, c.height * 0.84, c.width, c.height * 0.16);
  g.globalAlpha = 1;
  g.restore();

  } 

  // -------------------------
  // ARCTIC

  else if (map === "arctic") {
   
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;

  const hw = typeof navigator !== "undefined" ? (navigator as any).hardwareConcurrency : undefined;

  const isMobile = /Mobi|Android/i.test(ua);
  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2) || (hw && hw <= 2);

  // scale factors: lower workload on weak devices
  const D_SCALE = lowEnd ? 0.45 : 1;
  const DRIFT_LAYERS = lowEnd ? 2 : 3;
  const SPARKLE_COUNT = Math.max(20, Math.floor((lowEnd ? 36 : 140) * D_SCALE));
  const ICE_PANEL_COUNT = Math.max(1, Math.floor((lowEnd ? 2 : 4) * D_SCALE));
  const CRACK_COUNT = Math.max(2, Math.floor((lowEnd ? 3 : 8) * D_SCALE));

  // --- base sky / snow gradient (cheap) ---
  const snowGrad = g.createLinearGradient(0, 0, 0, c.height);
  snowGrad.addColorStop(0, "#f8fcff");
  snowGrad.addColorStop(0.2, "#eef8ff");
  snowGrad.addColorStop(0.6, "#e6eef6");
  snowGrad.addColorStop(1, "#cfd9e3");
  g.fillStyle = snowGrad;
  g.fillRect(0, 0, c.width, c.height);

  // --- layered drifts (large soft shapes, few segments) ---
  g.save();
  g.globalAlpha = 0.94;

  for (let d = 0; d < DRIFT_LAYERS; d++) {
    const baseY = Math.floor(c.height * (0.72 - d * 0.06) + randn(d, 3) * 10 * D_SCALE);
    const segs = 5; // small fixed seg count
    const light = 248 - d * 6;
    const dark = 220 - d * 8;
    const grad = g.createLinearGradient(0, baseY - 40, 0, baseY + 60);
    grad.addColorStop(0, `rgba(${light},${light},${light + 6},0.98)`);
    grad.addColorStop(1, `rgba(${dark},${dark + 6},${dark + 12},0.98)`);
    g.fillStyle = grad;

    g.beginPath();
    g.moveTo(0, c.height);

    for (let s = 0; s <= segs; s++) {

      const px = (s / segs) * c.width;

      const wob = Math.sin((s + d) * 0.7) * (8 + d * 6) * D_SCALE + randn(s, d) * 6 * D_SCALE;

        const py = baseY 
        - Math.abs(Math.cos(s * 0.9)) * (18 + d * 8) * D_SCALE 
        + wob * 0.32 
        + verticalWobble(px, Math.max(2, 6 * D_SCALE), 0.013, d + 31);

      const midX = Math.max(0, px - (c.width / segs) * 0.45);
      const midY = (py + baseY) * 0.5 - 5 * D_SCALE;
      g.quadraticCurveTo(midX, midY, px, py);
    }
    g.lineTo(c.width, c.height);
    g.closePath();
    g.fill();
  }
  g.restore();

  // --- ice plates / polished patches (few, larger) ---
  for (let p = 0; p < ICE_PANEL_COUNT; p++) {
    const px = Math.floor(randn(p, 2) * c.width);
    const py = Math.floor(randn(p, 7) * c.height * 0.6 + c.height * 0.24);
    const pw = Math.max(48, Math.floor((c.width * 0.12) * (0.6 + randn(p, 3) * 0.22) * D_SCALE));
    const ph = Math.max(14, Math.floor(pw * (0.22 + randn(p, 5) * 0.12)));
    const plateGrad = g.createLinearGradient(px - pw * 0.6, py - ph * 0.6, px + pw * 0.6, py + ph * 0.6);
    plateGrad.addColorStop(0, "rgba(230,245,255,0.88)");
    plateGrad.addColorStop(0.5, "rgba(210,230,245,0.95)");
    plateGrad.addColorStop(1, "rgba(185,210,230,0.9)");
    g.globalAlpha = 0.92;
    g.fillStyle = plateGrad;
    g.beginPath();
    g.moveTo(px - pw * 0.45, py);
    g.lineTo(px, py - ph * 0.45);
    g.lineTo(px + pw * 0.55, py);
    g.lineTo(px, py + ph * 0.55);
    g.closePath();
    g.fill();

    // tiny crisp streak on plate (single short stroke)
    g.globalAlpha = 0.12;
    g.strokeStyle = "rgba(245,255,255,0.95)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(px - pw * 0.12, py - ph * 0.04);
    g.lineTo(px + pw * 0.18 + randn(p, 2) * 4, py + ph * 0.08);
    g.stroke();
    g.globalAlpha = 1;
  }

  // --- controlled frost sparkles (cheap crosses instead of arcs) ---
  g.save();
  g.strokeStyle = "rgba(255,255,255,0.92)";
  g.lineWidth = 1;
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const x = (i * 97 + randn(i, 1) * 40) % c.width;
    const y = Math.floor(c.height * (0.06 + randn(i, 2) * 0.8));
    const r = lowEnd ? (1 + Math.random() * 0.9) : (0.9 + Math.random() * 1.6);
    // draw a tiny cross (very cheap)
    g.globalAlpha = 0.06 + Math.random() * (lowEnd ? 0.18 : 0.28);
    g.beginPath();
    g.moveTo(x - r, y);
    g.lineTo(x + r, y);
    g.moveTo(x, y - r);
    g.lineTo(x, y + r);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();

  // --- long ice cracks (few branches, single path each) ---
  g.save();
  g.strokeStyle = "rgba(200,230,250,0.14)";
  g.lineWidth = 1;

  for (let ci = 0; ci < CRACK_COUNT; ci++) {
    const sx = Math.floor(randn(ci, 2) * c.width);
    const sy = Math.floor(randn(ci, 5) * c.height * 0.6 + c.height * 0.2);
    g.beginPath();
    g.moveTo(sx, sy);
    let cx = sx;
    let cy = sy;
    const segs = lowEnd ? 4 : 6;
    for (let s = 0; s < segs; s++) {
      cx += (randn(ci, s) - 0.45) * (10 + s * 5) * D_SCALE;
      cy += 6 + randn(s, ci) * (8 + s * 1.5) * D_SCALE;
      g.lineTo(cx, cy);
      // cheap branching: a single short branch occasionally
      if (!lowEnd && Math.random() < 0.16 && s % 2 === 0) {
        g.moveTo(cx, cy);
        g.lineTo(cx + (randn(s, ci) - 0.5) * 10, cy + 6 + Math.random() * 8);
      }
    }
    g.stroke();
  }
  g.restore();

  // --- compact snow cap (wavy thin band) ---
  const gbThinArctic = Math.max(4, Math.floor(grassBand * 0.32 * D_SCALE));
  if (gbThinArctic > 0) {
    const capGrad = g.createLinearGradient(0, 0, 0, gbThinArctic);
    capGrad.addColorStop(0, "#ffffff");
    capGrad.addColorStop(0.6, "#eaf8ff");
    capGrad.addColorStop(1, "#dbeef7");
    g.fillStyle = capGrad;

    g.beginPath();
    g.moveTo(0, gbThinArctic);
    const segs = Math.max(4, Math.floor(c.width / 220));
    let pxPrev = 0;

    for (let s = 0; s <= segs; s++) {
      const px = (s / segs) * c.width;

        const py = gbThinArctic 
        - Math.sin(s * 0.8 + (c.width % 11)) * (1.5 + randn(s, 3) * 3) * D_SCALE
        + verticalWobble(px, 1.2 * D_SCALE, 0.02, s);

      const midX = (pxPrev + px) * 0.5;
      const midY = (gbThinArctic + py) * 0.5 - 2;
      g.quadraticCurveTo(midX, midY, px, py);
      pxPrev = px;
    }
    g.lineTo(c.width, gbThinArctic + 4);
    g.lineTo(c.width, 0);
    g.lineTo(0, 0);
    g.closePath();
    g.fill();

    // faint trim
    g.globalAlpha = 0.06;
    g.fillStyle = "rgba(0,0,0,0.08)";
    g.fillRect(0, gbThinArctic - 2, c.width, 2);
    g.globalAlpha = 1;
  }

  // --- bottom ambient occlusion / cool vignette (very cheap) ---
  g.save();
  g.globalAlpha = 0.05;
  g.fillStyle = "rgba(170,190,205,0.95)";
  g.fillRect(0, c.height * 0.82, c.width, c.height * 0.18);
  g.globalAlpha = 1;
  g.restore();
}



  
  // --- BANGULAND  ---
 
 else if (map === "bangu") {

  // device heuristics (cheaper on phones)
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;
  const isMobile = /Mobi|Android/i.test(ua);
  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2);

  // small deterministic alias to match other branches
  const n = (a: number, b: number) => randn(a, b);

  // Reuse meadow turf layout but convert colors/textures
  const gbThin = Math.max(10, Math.floor(grassBand * 0.5)); // thinner "green" strips become weeds
  const turfTotal = gbThin * 2.0;
  const turfTop = Math.max(6, Math.floor(turfTotal * 0.45));
  const turfMid = turfTop + Math.max(6, Math.floor(gbThin * 0.6));

  // 1) Base concrete slab (cool desaturated tones)
  const concreteGrad = g.createLinearGradient(0, 0, 0, c.height);
  concreteGrad.addColorStop(0, "#9a9a9aff");
  concreteGrad.addColorStop(0.45, "#7f7d7bff");
  concreteGrad.addColorStop(1, "#6a6765ff");
  g.fillStyle = concreteGrad;
  g.fillRect(0, 0, c.width, c.height);

  // 2) Top worn edge (where sidewalk/grass used to meet) — darker oily rim
  g.save();
  g.globalAlpha = lowEnd ? 0.08 : 0.16;
  const rimH = Math.max(10, Math.floor(turfTop * 0.9));
  const rimTop = Math.max(5, turfTop - Math.floor(rimH * 0.6));
  const segR = 6;
  g.beginPath();
  g.moveTo(0, rimTop);
  let lastX = 0;

  for (let s = 0; s <= segR; s++) {

    const px = (s / segR) * c.width;
    const wob = Math.sin(s * 1.2) * 3 + n(s, px) * 5;

    const py = rimTop + wob + verticalWobble(px, lowEnd ? 1.6 : 3.4, 0.02, 7);

    const midX = (lastX + px) * 0.5;
    const midY = (rimTop + py) * 0.5 - 2;
    g.quadraticCurveTo(midX, midY, px, py);
    lastX = px;
  }
  g.lineTo(c.width, rimTop + rimH);
  g.lineTo(0, rimTop + rimH);
  g.closePath();
  g.fillStyle = "#271f18";
  g.fill();
  g.restore();

  // 3) Main broken slab band with subtle cracks and patchwork
  const slabGrad = g.createLinearGradient(0, turfTop, 0, turfMid);
  slabGrad.addColorStop(0, "#b3b1ae");
  slabGrad.addColorStop(0.5, "#9e9b98");
  slabGrad.addColorStop(1, "#7f7d7b");
  g.fillStyle = slabGrad;
  g.beginPath();
  g.moveTo(0, turfTop);
  const segMain = Math.max(14, Math.floor(c.width / 120));
  lastX = 0;
  for (let s = 0; s <= segMain; s++) {
    const px = (s / segMain) * c.width;
    const wob = Math.sin(s * 0.7 + (c.width % 13)) * 9 + n(s, c.width) * 7;
    const py = turfMid - Math.abs(Math.cos(s * 0.42)) * 8 + wob * 0.45 + verticalWobble(px, lowEnd ? 2.5 : 6.5, 0.015, s + 11);
    const midX = (lastX + px) * 0.5;

    const midY = (turfTop + py) * 0.5 - Math.abs(Math.sin(s * 0.9)) * 3;
    g.quadraticCurveTo(midX, midY, px, py);
    lastX = px;
  }
  g.lineTo(c.width, turfMid);
  g.lineTo(0, turfMid);
  g.closePath();
  g.fill();

  // 4) Cracks network (denser than meadow splits)
  g.save();
  g.globalAlpha = 0.14;
  g.strokeStyle = "rgba(22,18,16,0.95)";
  g.lineWidth = lowEnd ? 0.8 : 1.4;
  const crackCount = lowEnd ? 8 : 30;
  for (let i = 0; i < crackCount; i++) {
    let sx = Math.floor(n(i, 12) * c.width);
    let sy = Math.floor(turfTop + n(i, 14) * (turfMid - turfTop));
    g.beginPath();
    g.moveTo(sx, sy);
    const segsC = lowEnd ? 4 : 10;
    for (let s = 0; s < segsC; s++) {
      sx += Math.round((n(i, s) - 0.5) * (14 + s * 8));
      sy += Math.floor(2 + n(s, i) * 8);
      g.lineTo(sx, sy);
      if (!lowEnd && Math.random() < 0.18) {
        g.moveTo(sx, sy);
        g.lineTo(sx + (n(s, i) - 0.5) * 12, sy + 6 + Math.random() * 8);
      }
    }
    g.stroke();
  }
  g.restore();

  // 5) Puddles / oil stains (reflective dark shapes, often near cracks)
  g.save();
  const puddleCount = lowEnd ? 3 : 12;
  for (let i = 0; i < puddleCount; i++) {
    if (Math.random() > 0.92) continue;
    const px = Math.floor(n(i, 41) * c.width);
    const py = Math.floor(turfMid - Math.abs(n(i, 42)) * (turfMid * 0.2));
    const rw = 12 + Math.floor(n(i, 43) * 48);
    const rh = Math.max(6, Math.floor(rw * (0.28 + n(i, 44) * 0.6)));
    g.globalAlpha = 0.28 + n(i, 45) * 0.32;
    const puddleGrad = g.createLinearGradient(px - rw, py - rh, px + rw, py + rh);
    puddleGrad.addColorStop(0, "rgba(20,18,16,0.12)");
    puddleGrad.addColorStop(0.5, "rgba(8,6,8,0.28)");
    puddleGrad.addColorStop(1, "rgba(16,14,12,0.06)");
    g.fillStyle = puddleGrad;
    g.beginPath();
    g.ellipse(px, py, rw, rh, (n(i, 50) - 0.5) * 0.3, 0, Math.PI * 2);
    g.fill();

    // subtle highlight on puddles (cheap)
    if (!lowEnd) {
      g.globalAlpha = 0.10;
      g.fillStyle = "rgba(255,255,255,0.6)";
      g.beginPath();
      g.ellipse(px - rw * 0.35, py - rh * 0.3, Math.max(2, rw * 0.18), Math.max(1, rh * 0.12), 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();

  // 6) Embedded brick fragments + small rubble (Bangla street flavour)
  const brickCount = lowEnd ? 8 : 24;
  g.save();
  for (let i = 0; i < brickCount; i++) {
    const bx = Math.floor(n(i, 21) * c.width);
    const by = Math.floor(turfMid - Math.abs(n(i, 22)) * (turfMid * 0.5));
    const bW = 5 + Math.floor(n(i, 23) * 20);
    const bH = Math.max(2, Math.floor(bW * (0.32 + n(i, 24) * 0.5)));
    const rot = (n(i, 27) - 0.5) * 0.6;
    g.save();
    g.translate(bx, by);
    g.rotate(rot);
    // chipped brick palette
    const r = 140 + Math.floor(n(i, 28) * 80);
    const gr = 60 + Math.floor(n(i, 29) * 50);
    const bl = 40 + Math.floor(n(i, 30) * 30);
    g.fillStyle = `rgba(${r},${gr},${bl},0.96)`;
    g.fillRect(-bW / 2, -bH / 2, bW, bH);

    // mortar / grime line
    g.globalAlpha = 0.16;
    g.fillStyle = "#1d1410";
    g.fillRect(-bW / 2, -bH / 2 + bH - 1.1, bW, 1);
    g.restore();
  }
  g.restore();

  // 7) Small weeds / tufts pushing through cracks (replaces meadow flowers)
  g.save();
  for (let x = 0; x < c.width; x += 14) {
    if (Math.random() < (lowEnd ? 0.06 : 0.12)) {
      const sx = x + Math.sin(x * 0.04) * 1.2 + (n(x, 5) - 0.5) * 6;
      const bladeH = 4 + Math.floor(n(x, 7) * (gbThin * 0.6));
      // small shadow
      g.globalAlpha = 0.12;
      g.fillStyle = "rgba(10,12,10,0.9)";
      g.beginPath();
      g.ellipse(sx + 1, turfTop + 1.5, 2.5, 0.8, 0, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;

      // weeds: 2-3 blades
      for (let b = 0; b < 3; b++) {
        const bx = sx + (b - 1) * 2.4 + (n(x + b, 10) - 0.5) * 1.6;
        const bh = bladeH - b * 0.8 + n(x + b, turfTop) * 1.6;
        g.beginPath();
        g.moveTo(bx, turfTop - 1);
        g.quadraticCurveTo(bx + 1.8, turfTop - bh, bx + 3, turfTop - 0.4);
        g.fillStyle = `rgba(${40 + Math.floor(n(x, 11) * 40)},${80 + Math.floor(n(x, 13) * 40)},${30 + Math.floor(n(x, 15) * 20)},${0.95 - b * 0.10})`;
        g.fill();
      }
    }
  }
  g.restore();

  // 8) Litter clusters: papers, small crates, bottles, rags
  const litterCount = lowEnd ? 12 : 48;
  g.save();
  for (let i = 0; i < litterCount; i++) {
    const lx = Math.floor(n(i, 31) * c.width);
    const ly = Math.floor(turfMid - Math.abs(n(i, 32)) * (turfMid * 0.45));
    const s = 1 + Math.floor(n(i, 33) * 8);
    g.globalAlpha = 0.9 - n(i, 34) * 0.6;
    const kind = Math.floor(n(i, 35) * 4);
    if (kind === 0) {
      // paper / leaflet
      g.fillStyle = `rgba(220,220,210,${0.7 - n(i, 5) * 0.4})`;
      g.fillRect(lx - s * 1.6, ly - s * 0.6, s * 3, s * 1.4);
      if (!lowEnd && Math.random() < 0.28) {
        g.globalAlpha = 0.22;
        g.fillStyle = "rgba(80,80,78,0.9)";
        g.fillRect(lx - s * 1.1, ly - s * 0.2, s * 1.6, 0.6);
      }
    } else if (kind === 1) {
      // wooden crate fragment
      g.fillStyle = `rgba(${110 + Math.floor(n(i, 36) * 40)},${70 + Math.floor(n(i, 37) * 30)},${40 + Math.floor(n(i, 38) * 20)},0.95)`;
      g.fillRect(lx - s, ly - s * 0.7, s * 2, s * 1.2);
    } else if (kind === 2) {
      // bottle / can
      g.beginPath();
      g.fillStyle = `rgba(${160 + Math.floor(n(i, 39) * 60)},${140 + Math.floor(n(i, 40) * 30)},${110},0.92)`;
      g.ellipse(lx, ly, s * 0.6, s * 0.6, 0, 0, Math.PI * 2);
      g.fill();
    } else {
      // cloth/rag
      g.fillStyle = `rgba(${120 + Math.floor(n(i, 46) * 80)},${80 + Math.floor(n(i, 47) * 30)},${80},0.9)`;
      g.fillRect(lx - s * 1.2, ly - s * 0.6, s * 2.6, s * 1.1);
    }
  }
  g.restore();

  // 9) Metal plates / drains / rebar poking out (small urban details)
  const metalCount = lowEnd ? 1 : 5;
  for (let m = 0; m < metalCount; m++) {
    const mx = Math.floor(n(m, 51) * c.width);
    const my = Math.floor(turfMid - Math.abs(n(m, 52)) * (turfMid * 0.3));
    const mr = 6 + Math.floor(n(m, 53) * 14);
    g.save();
    g.globalAlpha = 0.95;
    g.fillStyle = "#55524b";
    g.beginPath();
    g.ellipse(mx, my, mr, mr * 0.55, 0, 0, Math.PI * 2);
    g.fill();

    // faint rust lines
    g.globalAlpha = 0.12;
    g.strokeStyle = "#6a5d4c";
    g.lineWidth = 1;
    for (let s = 0; s < 4; s++) {
      const ang = (s / 4) * Math.PI * 2;
      g.beginPath();
      g.moveTo(mx, my);
      g.lineTo(mx + Math.cos(ang) * mr * 0.6, my + Math.sin(ang) * mr * 0.45);
      g.stroke();
    }
    g.restore();
  }

  // 10) Subtle dust / grime near bottom to blend into tiles
  g.save();
  g.globalAlpha = lowEnd ? 0.04 : 0.09;
  g.fillStyle = "#cfc7b8";
  g.beginPath();
  g.ellipse(c.width * 0.5, c.height * 0.84, c.width * 0.45, c.height * 0.08, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // 11) Light surface noise/grit
  g.save();
  g.globalAlpha = lowEnd ? 0.03 : 0.06;
  const granCount = lowEnd ? 80 : 320;
  for (let i = 0; i < granCount; i++) {
    const gx = (i * 61 + n(i, 59) * 52) % c.width;
    const gy = Math.floor(c.height * (0.62 + n(i, 57) * 0.28));
    const s = 0.35 + n(i, gx) * (lowEnd ? 0.7 : 1.4);
    g.beginPath();
    g.ellipse(gx + Math.sin(i) * 0.6, gy + Math.cos(i * 0.5) * 0.6, s, s * 0.7, 0, 0, Math.PI * 2);
    g.fillStyle = "rgba(0,0,0,0.6)";
    g.fill();
  }
  g.restore();

  // final tiny highlights and shine bits
  g.globalAlpha = 1;
} 



//   --- HAUNTED FOREST  ---
  else if (map === "haunted") {
  // device heuristics (keep detail adaptive)
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;
  const hw = typeof navigator !== "undefined" ? (navigator as any).hardwareConcurrency : undefined;
  const isMobile = /Mobi|Android/i.test(ua);
  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2) || (hw && hw <= 2);

  // 1) base foggy gradient (dark, cool)
  const fogGrad = g.createLinearGradient(0, 0, 0, c.height);
  fogGrad.addColorStop(0, "#16161a");   // deep top
  fogGrad.addColorStop(0.5, "#222328"); // mid fog
  fogGrad.addColorStop(1, "#151416");   // bottom deep
  g.fillStyle = fogGrad;
  g.fillRect(0, 0, c.width, c.height);

  // 2) large soft fog bands (subtle, layered)
  g.save();
  g.globalAlpha = lowEnd ? 0.06 : 0.12;
  for (let f = 0; f < (lowEnd ? 2 : 4); f++) {
    const fx = (f * 197 + randn(f, 5) * 100) % c.width;
    const fy = Math.floor(c.height * (0.12 + randn(f, 2) * 0.6));
    const fw = Math.max(60, Math.floor(c.width * (0.18 + randn(f, 3) * 0.18)));
    const fh = Math.max(24, Math.floor(26 + randn(f, 7) * 40));
    g.beginPath();
    g.ellipse(fx, fy, fw, fh, (randn(f, 9) - 0.5) * 0.2, 0, Math.PI * 2);
    g.fillStyle = `rgba(70,70,80,${0.08 + randn(f, 11) * 0.06})`;
    g.fill();
  }
  g.restore();

  // 3) mist particles / small puffs
  const mistCount = lowEnd ? 60 : 160;
  g.save();
  for (let i = 0; i < mistCount; i++) {
    const x = (i * 47 + randn(i, 2) * 61) % c.width;
    const y = (i * 31 + randn(2, i) * 43) % Math.floor(c.height * 0.66);
    const r = 0.8 + randn(i, 7) * 3.2;
    const a = 0.014 + randn(i, 9) * 0.03;
    g.beginPath();
    g.fillStyle = `rgba(200,210,220,${a})`;
    g.ellipse(x, y, r, r * (0.6 + randn(i, 4) * 1.2), 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // 4) distant glowing eyes (very subtle) — appear as small glows in the dark
  const eyeCount = lowEnd ? 2 : 6;
  for (let e = 0; e < eyeCount; e++) {
    const ex = Math.floor(randn(e, 6) * c.width);
    const ey = Math.floor((0.18 + randn(e, 4) * 0.42) * c.height);
    const glow = lowEnd ? 6 : 12;
    g.save();
    for (let gLayer = 0; gLayer < 3; gLayer++) {
      g.globalAlpha = 0.06 - gLayer * 0.02;
      g.fillStyle = `rgba(180,220,255,${0.12})`; // cold faint eye glow
      g.beginPath();
      g.ellipse(ex - gLayer * 0.6, ey - gLayer * 0.3, glow - gLayer * 3, (glow * 0.5) - gLayer * 2, 0, 0, Math.PI * 2);
      g.fill();
    }
    // bright pupil
    g.globalAlpha = 1;
    g.fillStyle = "#dbeef7";
    g.beginPath();
    g.arc(ex, ey, lowEnd ? 1.2 : 2.2, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // 5) dead tree silhouettes along horizon (cheap vector strokes)
  const treeCount = lowEnd ? 3 : 8;
  g.save();
  g.lineWidth = lowEnd ? 2 : 3;
  g.strokeStyle = "rgba(18,18,20,0.88)";
  for (let t = 0; t < treeCount; t++) {
    const tx = Math.floor(randn(t, 3) * c.width);
    const baseH = Math.round((16 + randn(t, 5) * 56) * (lowEnd ? 0.9 : 1.1));
    const ty = Math.floor(c.height * 0.5 + randn(t, 7) * (c.height * 0.22));
    // trunk
    g.beginPath();
    g.moveTo(tx, ty);
    g.lineTo(tx, ty - baseH);
    // two main branches
    g.moveTo(tx, ty - Math.round(baseH * 0.18));
    g.lineTo(tx - Math.round(6 + randn(t, 9) * 28), ty - Math.round(baseH * 0.45));
    g.moveTo(tx, ty - Math.round(baseH * 0.33));
    g.lineTo(tx + Math.round(6 + randn(t, 11) * 28), ty - Math.round(baseH * 0.62));
    g.stroke();
    // small twigs
    g.beginPath();
    g.moveTo(tx - 3, ty - Math.round(baseH * 0.72));
    g.lineTo(tx - 6 - Math.round(randn(t, 13) * 10), ty - Math.round(baseH * 0.78));
    g.moveTo(tx + 3, ty - Math.round(baseH * 0.82));
    g.lineTo(tx + 10 + Math.round(randn(t, 15) * 10), ty - Math.round(baseH * 0.86));
    g.stroke();
  }
  g.restore();

  // 6) tombstones and props (foreground near the ground band)
  const tombCount = lowEnd ? 3 : 8;
  for (let ts = 0; ts < tombCount; ts++) {
    const px = Math.floor(randn(ts, 4) * (c.width * 0.9) + c.width * 0.05);
    const baseY = Math.floor(c.height * 0.78 + randn(ts, 2) * c.height * 0.06);
    const tw = 16 + Math.floor(randn(ts, 7) * 20);
    const th = 22 + Math.floor(randn(ts, 9) * 36);
    g.save();
    // tombstone shadow / base
    g.globalAlpha = 0.18;
    g.fillStyle = "#000";
    g.beginPath();
    g.ellipse(px, baseY + 6, tw * 0.6, 6, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    // tombstone body (rounded top)
    g.fillStyle = "#2e2c2f";
    g.beginPath();
    g.moveTo(px - tw * 0.5, baseY);
    g.lineTo(px - tw * 0.5, baseY - th * 0.45);
    g.arcTo(px - tw * 0.5, baseY - th, px, baseY - th, tw * 0.5);
    g.arcTo(px + tw * 0.5, baseY - th, px + tw * 0.5, baseY - th * 0.45, tw * 0.5);
    g.lineTo(px + tw * 0.5, baseY);
    g.closePath();
    g.fill();
    // engraving (cross or skull)
    g.globalAlpha = 0.14;
    g.strokeStyle = "#bdb9b9";
    g.lineWidth = 1.2;
    g.beginPath();
    if (randn(ts, 11) > 0.6) {
      // cross
      g.moveTo(px, baseY - th * 0.18);
      g.lineTo(px, baseY - th * 0.6);
      g.moveTo(px - tw * 0.14, baseY - th * 0.36);
      g.lineTo(px + tw * 0.14, baseY - th * 0.36);
    } else {
      // little skull suggestion (circle + tine)
      g.arc(px, baseY - th * 0.38, Math.max(3, tw * 0.08), 0, Math.PI * 2);
    }
    g.stroke();
    g.globalAlpha = 1;
    g.restore();
  }

  // 7) cracked soil veins (cheap stroked lines)
  g.save();
  g.globalAlpha = 0.06;
  g.strokeStyle = "#0f0f10";
  g.lineWidth = 1;
  const crackCount = lowEnd ? 2 : 8;
  for (let cix = 0; cix < crackCount; cix++) {
    let sx = rndInt(0, c.width);
    let sy = Math.floor(c.height * 0.72 + randn(cix, 3) * c.height * 0.18);
    g.beginPath();
    g.moveTo(sx, sy);
    const segs = lowEnd ? 3 : 6;
    for (let s = 0; s < segs; s++) {
      sx += (randn(cix, s) - 0.45) * (20 + s * 6);
      sy += 6 + randn(s, cix) * 18;
      g.lineTo(sx, sy);
      if (!lowEnd && Math.random() < 0.18) {
        // small branch crack
        g.moveTo(sx, sy);
        g.lineTo(sx + (randn(s, cix) - 0.5) * 10, sy + 6 + Math.random() * 8);
      }
    }
    g.stroke();
  }
  g.restore();

  // 8) scattered bones & small debris (foreground)
  const boneCount = lowEnd ? 6 : 14;
  for (let b = 0; b < boneCount; b++) {
    const bx = Math.floor(randn(b, 3) * c.width);
    const by = Math.floor(c.height * 0.74 + randn(b, 5) * c.height * 0.18);
    const br = 3 + Math.floor(randn(b, 7) * 5);
    g.save();
    g.globalAlpha = 0.95;
    g.fillStyle = "#e9e6e2";
    g.beginPath();
    g.ellipse(bx, by, br, Math.max(1.2, br * 0.5), (randn(b, 2) - 0.5) * 0.4, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 0.18;
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.ellipse(bx - br * 0.3, by - br * 0.16, Math.max(1, br * 0.3), Math.max(0.6, br * 0.18), 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // 9) ghostly puddles / faint ambient highlights near horizon
  const puddCount = lowEnd ? 1 : 3;
  g.save();
  g.globalAlpha = 0.06;
  g.fillStyle = "#cbd6df";
  for (let p = 0; p < puddCount; p++) {
    const px = Math.floor(randn(p, 6) * c.width);
    const py = Math.floor(c.height * 0.78 + randn(p, 2) * 18);
    const pw = 28 + Math.floor(randn(p, 3) * 40);
    const ph = 6 + Math.floor(randn(p, 7) * 10);
    g.beginPath();
    g.ellipse(px, py, pw, ph, (randn(p, 11) - 0.5) * 0.12, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // 10) final haunted grass band (spooky tufts) - replaces previous simple band
  const gbThinHaunt = Math.max(8, Math.floor(grassBand * 0.48));
  const hauntedGrad = g.createLinearGradient(0, 0, 0, gbThinHaunt);
  hauntedGrad.addColorStop(0, "#2b2a2f");
  hauntedGrad.addColorStop(0.5, "#1e1e20");
  hauntedGrad.addColorStop(1, "#1d1b1d");
  g.fillStyle = hauntedGrad;

  // wavy top edge
  g.beginPath();
  g.moveTo(0, gbThinHaunt);
  const segs = Math.max(4, Math.floor(c.width / 220));
  let lastX = 0;
  for (let s = 0; s <= segs; s++) {
    const px = (s / segs) * c.width;
    const py = gbThinHaunt - Math.sin(s * 0.8 + (c.width % 11)) * (1.5 + randn(s, 3) * 3);
    const midX = (lastX + px) * 0.5;
    const midY = (gbThinHaunt + py) * 0.5 - 2;
    g.quadraticCurveTo(midX, midY, px, py);
    lastX = px;
  }
  g.lineTo(c.width, gbThinHaunt + 6);
  g.lineTo(c.width, 0);
  g.lineTo(0, 0);
  g.closePath();
  g.fill();

  // thin spectral rim and a very faint white band for creepy sheen
  g.save();
  g.globalAlpha = 0.06;
  g.fillStyle = "rgba(255,255,255,0.04)";
  g.fillRect(0, gbThinHaunt - 3, c.width, 3);
  g.restore();

  // subtle vignette near bottom to deepen mood (cheap)
  g.save();
  g.globalAlpha = 0.12;
  g.fillStyle = "rgba(0,0,0,0.95)";
  g.fillRect(0, c.height * 0.82, c.width, c.height * 0.18);
  g.restore();




  // DEFAULT (lush)
  // -------------------------
// ---------------------------
// DENSE FOREST ground (updated — barky, rocky, rooty, very textural)
// ---------------------------
// ---------------------------
// DENSE FOREST ground (dense tall grass & weeds at the top instead of moss)
// ---------------------------
// ---------------------------
// DENSE FOREST ground (updated — barky, rocky, rooty, very textural)
// ---------------------------
}

// ---------------------------
// DENSE FOREST----
 else if (map === "forest") {

  // device heuristics (adaptive detail)
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;
  const hw = typeof navigator !== "undefined" ? (navigator as any).hardwareConcurrency : undefined;
  const isMobile = /Mobi|Android/i.test(ua);
  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2) || (hw && hw <= 2);


  // turf layout — a bit taller/denser than meadow
  const gbThin = Math.max(10, Math.floor(grassBand * 0.64));
  const turfTotal = gbThin * 2.6;
  const turfTop = Math.max(10, Math.floor(turfTotal * 0.52)); // visible mossy/top layer
  const turfMid = turfTop + Math.max(6, Math.floor(gbThin * 0.66)); // soil split

  const earthGrad = g.createLinearGradient(0, 0, 0, c.height);
  earthGrad.addColorStop(0, "#1b2213ff");  
  earthGrad.addColorStop(0.28, "#2f2417ff"); 
  earthGrad.addColorStop(0.65, "#33241aff"); 
  earthGrad.addColorStop(1, "#352515ff");    
  g.fillStyle = earthGrad;
  g.fillRect(0, 0, c.width, c.height);

   {
    const blendH = 12; // total height of blend area (tweak if needed)
    const blendTop = Math.max(0, turfTop - Math.floor(blendH * 0.5));
    const blendBottom = blendTop + blendH;
    const blendGrad = g.createLinearGradient(0, blendTop, 0, blendBottom);
    blendGrad.addColorStop(0, "rgba(27,34,19,1)");
    blendGrad.addColorStop(0.5, "rgba(30,40,22,0.7)");
    blendGrad.addColorStop(1, "rgba(31,45,25,0)");
    g.save();
    g.globalAlpha = 1;
    g.fillStyle = blendGrad;
    g.fillRect(0, blendTop, c.width, blendH);
    g.restore();
  }

   g.save();
  const tuftSpacing = lowEnd ? 12 : 7; // how often we start a tuft
  const bladeColors = lowEnd
    ? ["#234d26", "#2a5d2d", "#1f4a22"]
    : ["#14461f", "#1f5e28", "#2a6f30", "#183f18"]; // mix for depth

  for (let x = -tuftSpacing; x < c.width + tuftSpacing; x += tuftSpacing) {
    // increase density slightly in mid screen, randomize presence
    if (Math.random() > (lowEnd ? 0.85 : 0.65)) continue;

    const originX = x + (randn(x, 3) - 0.5) * tuftSpacing * 0.6;
    // anchor slightly above turfTop to hide any top edge
   const anchorY = turfTop + rndInt(-6, 2)

    const blades = rndInt(lowEnd ? 3 : 5, lowEnd ? 4 : 8);
    const maxBladeH = rndInt(Math.max(8, gbThin * 1.0), Math.max(18, gbThin * 2.0));

    for (let b = 0; b < blades; b++) {
      // height and lateral offset vary per blade
      const bladeH = Math.max(6, Math.floor(maxBladeH * (0.6 + randn(x + b, 11) * 0.7)));
      const bladeX = originX + (b - Math.floor(blades / 2)) * (1.8 + randn(b, x) * 2.2);
      const color = bladeColors[(Math.abs(Math.floor(randn(x + b, 7) * bladeColors.length)) % bladeColors.length)];
      g.fillStyle = color;

      g.beginPath();
      g.moveTo(bladeX, anchorY);

      // first segment -> mid1
      const mid1X = bladeX + (randn(x + b, 13) - 0.5) * 10;
      const mid1Y = anchorY - bladeH * (0.35 + randn(b, 5) * 0.14);

      // second segment -> mid2 (more pronounced)
      const mid2X = mid1X + (randn(x + b, 17) - 0.5) * 10;
      const mid2Y = anchorY - bladeH * (0.7 + randn(b, 19) * 0.25);

      // tip
      const tipX = mid2X + (randn(x + b, 23) - 0.5) * 6;
      const tipY = anchorY - bladeH - rndInt(0, 4);

      // left side curve
      g.quadraticCurveTo(mid1X, mid1Y, (mid1X + mid2X) * 0.5, (mid1Y + mid2Y) * 0.5);
      g.quadraticCurveTo(mid2X, mid2Y, tipX, tipY);

      // build the return side with a small offset (gives thickness)
      const returnX1 = tipX + (randn(b, 29) - 0.5) * 5;
      const returnY1 = tipY + rndInt(1, 3);
      const returnX2 = bladeX + (randn(b, 31) - 0.5) * 6;
      const returnY2 = anchorY + rndInt(0, 2);

      g.quadraticCurveTo(returnX1, returnY1, returnX2, returnY2);
      g.closePath();

      // slight alpha variation for depth
      g.globalAlpha = 0.94 - (b * 0.06) - (Math.abs(randn(x + b, 41)) * 0.06);
      g.fill();

      // subtle darker stroke at the back of some blades for separation
      if (!lowEnd && Math.random() < 0.28) {
        g.globalAlpha = 0.14;
        g.strokeStyle = "rgba(6,20,10,0.9)";
        g.lineWidth = 0.8;
        g.stroke();
      }

      g.globalAlpha = 1;
    }

  
  // darker trim to separate soil
  g.globalAlpha = 0.18;
  g.fillStyle = "rgba(6,30,16,0.95)";
  g.fillRect(0, turfMid - 6, c.width, 6);
  g.globalAlpha = 1;

  // --- fallen leaf litter (varied warm/dark specks) ---
  g.save();
  g.globalAlpha = lowEnd ? 0.07 : 0.17;
  const leafCount = lowEnd ? 120 : 520;

  for (let i = 0; i < leafCount; i++) {
    const lx = Math.floor((i * 37 + randn(i, 2) * 41) % c.width);
    const ly = turfTop + Math.floor(randn(i, 7) * (turfMid - turfTop));
    const s = 0.4 + randn(i, lx) * (lowEnd ? 0.9 : 1.8);
    const col = i % 5 === 0 ? "#562e16ff" : i % 5 === 1 ? "#522412ff" : i % 5 === 2 ? "#914b20ff" : "#704224";
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(lx, ly, s * (1 + (i % 3)), s * 0.7, (randn(i, 3) - 0.5) * 0.6, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // --- exposed roots / root veins (meandering) ---
  g.save();
  g.globalAlpha = lowEnd ? 0.08 : 0.16;
  g.strokeStyle = "rgba(60,40,25,0.95)";
  g.lineWidth = lowEnd ? 1 : 1.8;
  const rootCount = lowEnd ? 4 : 10;
  for (let r = 0; r < rootCount; r++) {
    let rx = Math.floor(randn(r, 2) * c.width);
    let ry = turfTop + Math.floor(randn(r, 5) * (turfMid - turfTop) * 0.6);
    g.beginPath();
    g.moveTo(rx, ry);
    const segs = lowEnd ? 3 : 7;
    for (let s = 0; s < segs; s++) {
      rx += (randn(r, s) - 0.5) * (16 + s * 6);
      ry += 4 + randn(s, r) * 8;
      g.lineTo(rx, ry);
      // occasional short offshoot
      if (!lowEnd && Math.random() < 0.22) {
        g.moveTo(rx, ry);
        g.lineTo(rx + (randn(s, r) - 0.5) * 8, ry + 6 + Math.random() * 8);
      }
    }
    g.stroke();
  }
  g.restore();

  // --- fallen logs (rounded, with rings / bark) ---
  g.save();
  const logCount = lowEnd ? 1 : 4;
  for (let L = 0; L < logCount; L++) {
    if (Math.random() < 0.7) continue; // keep sparsity
    const lx = Math.floor(randn(L, 7) * c.width);
    const ly = turfMid - Math.floor(randn(L, 9) * (turfMid - turfTop) * 0.4) + rndInt(-3, 6);
    const lw = rndInt(18, 48);
    const lh = Math.max(6, Math.floor(lw * 0.28));
    // bark body
    g.globalAlpha = 0.95;
    g.fillStyle = "#6a482f";
    g.beginPath();
    g.ellipse(lx, ly, lw * 0.6, lh, (randn(L, 2) - 0.5) * 0.22, 0, Math.PI * 2);
    g.fill();
    // rings (end cap)
    g.globalAlpha = 0.18;
    g.fillStyle = "#d7bfa3";
    g.beginPath();
    g.ellipse(lx - lw * 0.55, ly, Math.max(4, lw * 0.18), Math.max(2, lh * 0.4), 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    // subtle bark texture: thin strokes
    if (!lowEnd) {
      g.save();
      g.globalAlpha = 0.08;
      g.strokeStyle = "#3e2a20";
      g.lineWidth = 1;
      for (let t = 0; t < 8; t++) {
        const sx = lx - lw * 0.4 + rndInt(0, lw * 0.8);
        const sy = ly - lh * 0.6 + rndInt(0, lh * 1.2);
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(sx + rndInt(-6, 6), sy + rndInt(6, 12));
        g.stroke();
      }
      g.restore();
    }
  }
  g.restore();

  // --- rocks, pebbles and boulders (clustered, with soft shadows) ---
  const rockCount = lowEnd ? 15 : 56;
  for (let i = 0; i < rockCount; i++) {
    const rx = Math.floor(randn(i, 2) * c.width);
    const ry = turfMid + Math.floor(randn(i, 7) * (c.height - turfMid) * 0.7);
    const r = Math.max(2, Math.floor(2 + randn(i, 11) * (lowEnd ? 8 : 18)));
    // shadow
    g.globalAlpha = 0.12;
    g.fillStyle = "rgba(6,4,3,0.9)";
    g.beginPath();
    g.ellipse(rx + r * 0.08, ry + r * 0.48, r * 0.9, r * 0.36, 0, 0, Math.PI * 2);
    g.fill();
    // rock body
    g.globalAlpha = 1;
    const tone = 70 + (i % 6) * 8 + Math.floor(randn(i, rx) * 40);
    g.fillStyle = `rgba(${tone - 10},${tone - 8},${tone - 28},0.96)`;
    g.beginPath();
    g.ellipse(rx, ry, r * 0.9, r * 0.7, (randn(i, 5) - 0.5) * 0.12, 0, Math.PI * 2);
    g.fill();
    // highlight
    g.globalAlpha = 0.10;
    g.fillStyle = "rgba(255,255,255,0.92)";
    g.beginPath();
    g.ellipse(rx - r * 0.18, ry - r * 0.14, Math.max(1, r * 0.18), Math.max(0.6, r * 0.11), 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
  }

  // --- mushrooms & fungi clusters (denser than meadow) ---
  g.save();
  for (let m = 0; m < (lowEnd ? 10 : 47); m++) {
    if (Math.random() < 0.7) {
      const mx = Math.floor(randn(m, 7) * c.width);
      const my = turfMid - Math.floor(randn(m, 11) * (turfMid - turfTop) * 0.65);
      const mr = Math.max(2, Math.floor(2 + randn(m, 3) * 5));
      g.globalAlpha = 0.98;
      const pal = ["#d94b3b", "#ffb07a", "#c96a8b", "#f6d37a"];
      g.fillStyle = pal[m % pal.length];
      g.beginPath();
      g.arc(mx, my, mr, Math.PI, 0, true);
      g.fill();
      // stem
      g.fillStyle = "#efe4d3";
      g.fillRect(mx - Math.max(0.5, mr * 0.12), my, Math.max(1, mr * 0.4), Math.max(4, mr * 1.6));
    }
  }
  g.globalAlpha = 1;
  g.restore();

  // --- small shrubs, ferns and tufts to add density (foreground cluster drawing) ---
  g.save();
  for (let sI = 0; sI < (lowEnd ? 12 : 46); sI++) {
    if (Math.random() < 0.7) {
      const sx = Math.floor(randn(sI, 19) * c.width);
      const sy = turfMid - Math.floor(randn(sI, 13) * (turfMid - turfTop) * 0.65);
      const rx = rndInt(6, 20);
      const ry = rndInt(4, 12);
      // leafy blob base
      g.globalAlpha = 0.95;
      g.fillStyle = ["#234f2c", "#2e5d32", "#1f4a28"][sI % 3];
      g.beginPath();
      g.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
      // fern fronds (cheap arcs)
      if (!lowEnd && Math.random() < 0.6) {
        g.strokeStyle = "rgba(89, 214, 67, 0.9)";
        g.lineWidth = 1;
        for (let f = 0; f < 3; f++) {
          g.beginPath();
          g.moveTo(sx - rx * 0.2, sy);
          g.quadraticCurveTo(sx - rx * 0.6, sy - ry * (0.6 + f * 0.2), sx - rx, sy - ry * (0.2 + f * 0.2));
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    }
  }
  g.restore();

  // --- damp/wet patches and tiny puddles (glossy, for realism) ---
  g.save();
  g.globalAlpha = lowEnd ? 0.05 : 0.12;
  for (let w = 0; w < (lowEnd ? 3 : 14); w++) {
    if (Math.random() < 0.6) {
      const wx = Math.floor(randn(w, 13) * c.width);
      const wy = turfMid + Math.floor(randn(w, 17) * (c.height - turfMid) * 0.45);
      const ww = rndInt(12, 48);
      const wh = Math.max(4, Math.floor(ww * 0.18));
      g.fillStyle = "rgba(20,30,36,0.28)";
      g.beginPath();
      g.ellipse(wx, wy, ww, wh, (randn(w, 11) - 0.5) * 0.1, 0, Math.PI * 2);
      g.fill();
      // glossy highlight
      if (!lowEnd) {
        g.globalAlpha = 0.10;
        g.fillStyle = "rgba(255,255,255,0.7)";
        g.beginPath();
        g.ellipse(wx - ww * 0.22, wy - wh * 0.22, Math.max(3, ww * 0.12), Math.max(1, wh * 0.28), 0, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = lowEnd ? 0.05 : 0.12;
      }
    }
  }
  g.restore();

  // --- very subtle bark texture overlay (cheap stipple) ---
  g.save();
  g.globalAlpha = lowEnd ? 0.02 : 0.06;
  g.fillStyle = "#0f0d0b";
  const grain = lowEnd ? 1200 : 4200;
  for (let i = 0; i < grain; i += Math.max(1, Math.floor(randn(i, 3) * 6))) {
    const gx = Math.floor(randn(i, 2) * c.width);
    const gy = Math.floor(randn(2, i) * c.height);
    if (Math.random() < 0.75) {
      g.fillRect(gx, gy, 1, 1);
    }
  }
  g.restore();

  // subtle dark vignette near bottom to help tile blending
  g.save();
  g.globalAlpha = 0.10;
  g.fillStyle = "rgba(8,6,4,0.95)";
  g.fillRect(0, c.height * 0.82, c.width, c.height * 0.18);
  g.globalAlpha = 1;
  g.restore();
}

} 

// -------------------------
  // BEACH ground 

else if (map === "beach") {
  // device heuristics
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;
  const hw = typeof navigator !== "undefined" ? (navigator as any).hardwareConcurrency : undefined;
  const isMobile = /Mobi|Android/i.test(ua);
  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2) || (hw && hw <= 2);

  // structure similar to desert but tuned for shoreline look
  const gbThin = Math.max(8, Math.floor(grassBand * 0.5));
  const turfTotal = gbThin * 2.0;
  const turfTop = Math.max(6, Math.floor(turfTotal * 0.45));
  const turfMid = turfTop + Math.max(6, Math.floor(gbThin * 0.5));

  // warm bright sand base
  const sandGrad = g.createLinearGradient(0, 0, 0, c.height);
  sandGrad.addColorStop(0, "#f9edd4ff");
  sandGrad.addColorStop(0.38, "#e9d88cff");
  sandGrad.addColorStop(0.72, "#d8be81ff");
  sandGrad.addColorStop(1, "#b4995dff");
  g.fillStyle = sandGrad;
  g.fillRect(0, 0, c.width, c.height);

  // subtle wet-sand band (near waterline look)
  const wetH = Math.max(9, Math.floor(turfTop * 0.7));
  const wetGrad = g.createLinearGradient(0, turfTop - wetH, 0, turfTop + wetH);
  wetGrad.addColorStop(0, "rgba(255,255,255,0)");
  wetGrad.addColorStop(0.45, wetSandColorFallback());
  wetGrad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = wetGrad;
  g.fillRect(0, turfTop - wetH, c.width, wetH * 2);

  // sand ripples (curved strokes)
  g.save();
  g.globalAlpha = lowEnd ? 0.06 : 0.12;
  g.strokeStyle = "rgba(210,180,140,0.18)";
  g.lineWidth = lowEnd ? 0.8 : 1.6;
  const rippleCount = lowEnd ? 45 : 160;
  for (let i = 0; i < rippleCount; i++) {
    const x = (i * 47 + randn(i, 4) * 46) % c.width;
    const y = Math.floor(c.height * (0.55 + randn(i, 7) * 0.28));
    const len = 26 + Math.floor(randn(i, 8) * 36);
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + len * 0.5, y - 6 - randn(i, 2) * 6, x + len, y - 2 + Math.sin(i) * 2);
    g.stroke();
  }
  g.restore();


  // shells/pebbles scattered
  g.save();
  g.globalAlpha = 0.97;
  for (let p = 0; p < (lowEnd ? 48 : 141); p++) {
    const px = Math.floor(randn(p, 5) * c.width);
    const py = turfTop + Math.floor(randn(p, 9) * (turfMid - turfTop + 16));
    const sw = rndInt(1, 3);
    g.fillStyle = ["#f6ddadff", "#d3c4a1ff", "#cbbba0"][p % 3];
    g.beginPath();
    g.ellipse(px, py, sw, sw * 0.6, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

// small stones (replaces driftwood planks)
g.save();
g.globalAlpha = 0.95;
g.fillStyle = "#8b7f74"; // base stone tone
for (let d = 0; d < (lowEnd ? 2 : 6); d++) {
  if (Math.random() < 0.7) {
    const dx = Math.floor(randn(d, 4) * c.width);
    const dy = turfTop + rndInt(0, Math.max(4, gbThin));

    // stone size & orientation
    const stoneW = rndInt(8, lowEnd ? 18 : 36);
    const stoneH = Math.max(4, Math.floor(stoneW * (0.42 + Math.random() * 0.28)));
    const rot = (randn(d, 6) - 0.5) * 0.6;

    // main stone body (elliptical)
    g.save();
    g.translate(dx, dy);
    g.rotate(rot);
    g.beginPath();
    g.ellipse(0, 0, stoneW * 0.5, stoneH, (Math.random() - 0.5) * 0.12, 0, Math.PI * 2);
    // subtle tone variation per stone
    const toneShift = Math.round((Math.random() - 0.5) * 24);
    const baseTone = 139 + toneShift; // around #8b7f74
    g.fillStyle = `rgba(${baseTone},${baseTone-6},${baseTone-12},0.98)`;
    g.fill();
    g.restore();

    // tiny shadow under stone to ground it
    g.globalAlpha = 0.16;
    g.fillStyle = "rgba(6,5,4,0.95)";
    g.beginPath();
    g.ellipse(dx + stoneW * 0.06, dy + stoneH * 0.5, stoneW * 0.5, Math.max(3, stoneH * 0.36), 0, 0, Math.PI * 2);
    g.fill();

    // small highlight (soft crescent) — keeps same alpha pattern as original
    g.globalAlpha = 0.12;
    g.fillStyle = "#d7d2cc";
    g.save();
    g.translate(dx - Math.round(stoneW * 0.18), dy - Math.round(stoneH * 0.22));
    g.rotate(rot * 0.6);
    g.beginPath();
    g.ellipse(0, 0, Math.max(3, stoneW * 0.16), Math.max(1, stoneH * 0.22), 0, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // reset alpha and fillStyle for next iteration (keeps original structure)
    g.globalAlpha = 0.95;
    g.fillStyle = "#8b7f74";
  }
}
g.restore();

  // faint foam streaks (cheap arcs)
  g.save();
  g.globalAlpha = 0.08;
  g.strokeStyle = "rgba(255,255,255,0.95)";
  g.lineWidth = 1;
  for (let f = 0; f < (lowEnd ? 4 : 12); f++) {
    const fx = Math.floor(randn(f, 2) * c.width);
    const fy = turfTop + rndInt(-6, 10);
    g.beginPath();
    g.moveTo(fx, fy);
    g.quadraticCurveTo(fx + rndInt(-16, 16), fy + rndInt(6, 18), fx + rndInt(30, 80), fy + rndInt(-6, 8));
    g.stroke();
  }
  g.restore();

  // small seaweed tufts (near the wet band) — more realistic multi-blade tufts
g.save();
for (let s = 0; s < (lowEnd ? 6 : 18); s++) {
  if (Math.random() < 0.6) {
    const sx = Math.floor(randn(s, 6) * c.width);
    const sy = turfTop + rndInt(0, gbThin);

    // tuft properties
    const blades = 3 + rndInt(0, lowEnd ? 1 : 3); // 3-6 blades on fuller devices
    const maxLen = lowEnd ? rndInt(8, 14) : rndInt(12, 30);
    const sway = (Math.random() - 0.5) * 0.6; // small rotation per tuft

    // color family pick with slight variation
    const baseG = 95 + Math.round(Math.random() * 90); // 95..185
    const baseR = 30 + Math.round(Math.random() * 30);
    const baseB = 40 + Math.round(Math.random() * 30);

    // draw a soft dirt/base patch so blades sit on sand
    g.globalAlpha = lowEnd ? 0.08 : 0.14;
    g.fillStyle = `rgba(${40},${30},${22},${1})`;
    g.beginPath();
    g.ellipse(sx, sy + 2, 4 + Math.random() * 4, 2 + Math.random() * 2, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;

    // each blade
    for (let b = 0; b < blades; b++) {
      const len = Math.floor(maxLen * (0.7 + Math.random() * 0.7));
      const ctrlOffsetX = rndInt(-6, 6) + Math.round(sway * len);
      const ctrlOffsetY = -Math.floor(len * (0.45 + Math.random() * 0.15));
      const tipX = sx + rndInt(-Math.floor(len * 0.4), Math.floor(len * 0.6));
      const tipY = sy - len;

      // blade stroke
      g.lineWidth = lowEnd ? 0.7 : (0.9 + Math.random() * 1.2);
      g.lineCap = "round";
      // slightly different greens per blade
      const gCol = Math.max(60, Math.min(220, baseG + rndInt(-18, 18)));
      const rCol = Math.max(12, Math.min(80, baseR + rndInt(-8, 8)));
      const bCol = Math.max(12, Math.min(90, baseB + rndInt(-8, 8)));
      g.strokeStyle = `rgba(${rCol},${gCol},${bCol},${0.92 - Math.random() * 0.18})`;

      g.beginPath();
      g.moveTo(sx, sy);
      // slightly wavy curved blade using two quadratic segments for realism
      const midX = sx + Math.round(ctrlOffsetX * (0.5 + Math.random() * 0.4)) + rndInt(-4,4);
      const midY = sy + Math.round(ctrlOffsetY * (0.6 + Math.random() * 0.2));
      g.quadraticCurveTo(midX, midY, tipX, tipY);
      g.stroke();

      // subtle fuller shape (thin filled crescent) for richer look
      if (!lowEnd && Math.random() < 0.6) {
        g.globalAlpha = 0.14;
        g.fillStyle = `rgba(${rCol + 10},${gCol + 18},${bCol + 6},0.95)`;
        g.beginPath();
        // small filled shape along the lower third of the blade
        const fx = sx + (midX - sx) * 0.35;
        const fy = sy + (midY - sy) * 0.35;
        g.ellipse(fx, fy, Math.max(1.5, len * 0.08), Math.max(2, len * 0.18), 0, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }
    }

    // tiny highlight lines on a couple blades (wet sheen)
    if (!lowEnd && Math.random() < 0.45) {
      const hlBlade = rndInt(0, Math.max(1, blades - 1));
      g.lineWidth = 0.8;
      g.strokeStyle = "rgba(255,255,255,0.18)";
      g.beginPath();
      // subtle short curve near the tip area
      const hx1 = sx + rndInt(-4, 6);
      const hy1 = sy - Math.floor(maxLen * 0.55);
      const hx2 = sx + rndInt(2, 10);
      const hy2 = sy - Math.floor(maxLen * 0.82);
      g.moveTo(hx1, hy1);
      g.quadraticCurveTo((hx1 + hx2) / 2 + rndInt(-4,4), (hy1 + hy2) / 2 + rndInt(-3,3), hx2, hy2);
      g.stroke();
    }
  }
}
g.restore();

  // gentle bottom vignette for depth
  g.save();
  g.globalAlpha = 0.06;
  g.fillStyle = "rgba(180,150,120,0.95)";
  g.fillRect(0, c.height * 0.82, c.width, c.height * 0.18);
  g.globalAlpha = 1;
  g.restore();

  // helper to fallback wet sand color (keeps the branch self-contained)
  function wetSandColorFallback() {
    return "rgba(200,170,115,0.24)";
  } 
}



// -------------------------
//Meadows ground

  else {
  const gbThin = Math.max(8, Math.floor(grassBand * 0.56));
  const turfTotal = gbThin * 2.5; 
  const turfTop = Math.max(6, Math.floor(turfTotal * 0.5)); 
  const turfMid = turfTop + Math.max(6, Math.floor(gbThin * 0.6)); 

  const segmentsTop = Math.max(6, Math.floor(c.width / 160));

  const topPoints: { x: number; y: number }[] = [];
  for (let s = 0; s <= segmentsTop; s++) {
    const px = (s / segmentsTop) * c.width;
    const wob = Math.sin(s * 1.1) * 4 + randn(s, px) * 6;
    const py = turfTop - Math.abs(Math.sin(s * 0.6)) * 4 + wob * 0.5;
    topPoints.push({ x: px, y: py });
  }

  const grassTopGrad = g.createLinearGradient(0, 0, 0, turfTop);
  grassTopGrad.addColorStop(0, "#c3e9a2ff");
  grassTopGrad.addColorStop(0.35, "#a9f28eff");
  grassTopGrad.addColorStop(0.7, "#71c24a");
  grassTopGrad.addColorStop(1, "#2f7b2a");
  g.fillStyle = grassTopGrad;

  g.beginPath();
  // move to first top point
  g.moveTo(topPoints[0].x, topPoints[0].y);
  // smooth curve across the shared points (quadratic with midpoints)
  let last = topPoints[0];
  for (let i = 1; i < topPoints.length; i++) {
    const pt = topPoints[i];
    const midX = (last.x + pt.x) * 0.5;
    const midY = (last.y + pt.y) * 0.5 - 4; // slight upward bias for decorative top
    g.quadraticCurveTo(midX, midY, pt.x, pt.y);
    last = pt;
  }
  // close to top of canvas so decorative band fills upward
  g.lineTo(c.width, 0);
  g.lineTo(0, 0);
  g.closePath();
  g.fill();

  // --- main grassy mound (middle band) — use the exact same topPoints as its top edge
  const turfGrad = g.createLinearGradient(0, turfTop, 0, turfMid);
  turfGrad.addColorStop(0, "#9fe79a");
  turfGrad.addColorStop(0.45, "#6ecf62");
  turfGrad.addColorStop(1, "#3b8733");
  g.fillStyle = turfGrad;

  g.beginPath();
  // start at the first top point (same as above)
  g.moveTo(topPoints[0].x, topPoints[0].y);
  last = topPoints[0];
  for (let i = 1; i < topPoints.length; i++) {
    const pt = topPoints[i];
    // use midpoint smoothing from the same shared points (so edges match perfectly)
    const midX = (last.x + pt.x) * 0.5;
    const midY = (last.y + pt.y) * 0.5;
    g.quadraticCurveTo(midX, midY, pt.x, pt.y);
    last = pt;
  }
  // then drop down to the turfMid baseline and close
  g.lineTo(c.width, turfMid);
  g.lineTo(0, turfMid);
  g.closePath();
  g.fill();

  // add darker trim at turfMid to separate grassy half from soil half
  g.globalAlpha = 0.16;
  g.fillStyle = "rgba(6,40,18,0.95)";
  g.fillRect(0, turfMid - 6, c.width, 6);
  g.globalAlpha = 1;

  g.save();
  for (let x = 0; x < c.width; x += 7) {
    const sx = x + Math.sin(x * 0.06) * 1.6;
    const bladeH = 6 + Math.floor(randn(x, turfTop) * (gbThin * 0.9));
    // small base shadow for tuft
    g.globalAlpha = 0.15;
    g.fillStyle = "rgba(6,30,14,0.9)";
    g.beginPath();
    g.ellipse(sx + 2, turfTop + 2, 3, 1.1, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;

    // tuft (3 blades)
    const rcol = 70 + (x % 40) + Math.floor(randn(x, 13) * 40);
    const gcol = 120 + (x % 80) + Math.floor(randn(x, 17) * 40);
    const bcol = 40 + (x % 20) + Math.floor(randn(x, turfTop) * 18);
    for (let b = 0; b < 3; b++) {
      const bx = sx + (b - 1) * 3;
      const bh = bladeH - b * 1.5 + randn(x + b, turfTop) * 2.2;
      g.beginPath();
      g.moveTo(bx, turfTop - 1);
      g.quadraticCurveTo(bx + 2.6, turfTop - bh, bx + 4, turfTop - 0.6);
      g.fillStyle = `rgba(${rcol},${gcol},${bcol},${0.9 - b * 0.08})`;
      g.fill();
    }

    // small flowers scattered on grassy half
    if (Math.random() < 0.045) {
      const fx = sx + rndInt(-6, 6);
      const fy = turfTop - Math.max(6, Math.floor(bladeH * 0.6));
      // petals
      g.beginPath();
      g.fillStyle = "#ffd2d8";
      g.arc(fx, fy, 1.6 + Math.random() * 1.6, 0, Math.PI * 2);
      g.fill();
      // center
      g.fillStyle = "#ffb84d";
      g.fillRect(fx - 0.5, fy - 0.5, 1, 1);
    }
  }
  g.restore();

  // soil gradient for lower half (unchanged)
  const soilGradLower = g.createLinearGradient(0, turfMid, 0, c.height);
  soilGradLower.addColorStop(0, "#5b3f2a");
  soilGradLower.addColorStop(0.4, "#4b3323");
  soilGradLower.addColorStop(1, "#382714");
  g.fillStyle = soilGradLower;
  g.fillRect(0, turfMid, c.width, c.height - turfMid);

  // pebbles and small rocks focused in the soil half (unchanged)
  for (let i = 0; i < 48; i++) {
    const rx = Math.floor(randn(i, 2) * c.width);
    const ry = turfMid + Math.floor(randn(i, 7) * (c.height - turfMid) * 0.9);
    const r = 4 + Math.floor(randn(i, 11) * 14);
    // subtle shadow
    g.globalAlpha = 0.14;
    g.fillStyle = "rgba(12,8,6,0.9)";
    g.beginPath();
    g.ellipse(rx + r * 0.08, ry + r * 0.48, r * 0.8, r * 0.36, 0, 0, Math.PI * 2);
    g.fill();
    // stone main
    g.globalAlpha = 1;
    const grey = 80 + (i % 40);
    g.fillStyle = `rgba(${grey - 20},${grey - 18},${grey - 30},0.95)`;
    g.beginPath();
    g.ellipse(rx, ry, r * 0.9, r * 0.7, (randn(i, 5) - 0.5) * 0.15, 0, Math.PI * 2);
    g.fill();
    // tiny highlight
    g.globalAlpha = 0.12;
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.beginPath();
    g.ellipse(rx - r * 0.22, ry - r * 0.16, Math.max(1.2, r * 0.22), Math.max(0.7, r * 0.14), 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
  }

  // subtle root veins and cracks in the soil half (unchanged)
  g.save();
  g.globalAlpha = 0.06;
  g.strokeStyle = "rgba(20,14,10,0.95)";
  g.lineWidth = 1.2;
  for (let r = 0; r < 10; r++) {
    const sx = rndInt(0, c.width);
    let x = sx;
    let y = turfMid + Math.floor(randn(r, sx) * 18);
    g.beginPath();
    g.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (randn(r, j) - 0.45) * 26;
      y += 6 + randn(j, r) * 12;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.restore();

  // small dirt specs and dust (unchanged)
  for (let i = 0; i < 160; i++) {
    const x = (i * 53 + randn(i, 6) * 38) % c.width;
    const y = turfMid + (i * 31 + randn(3, i) * 18) % (c.height - turfMid);
    const s = 0.5 + randn(i, x) * 1.2;
    const alpha = 0.04 + (randn(i, y) * 0.06);
    g.fillStyle = `rgba(60,50,40,${alpha})`;
    g.beginPath();
    g.ellipse(x + Math.sin(i) * 1.2, y + Math.cos(i * 0.5) * 0.8, s, s * 0.8, 0, 0, Math.PI * 2);
    g.fill();
  }

  // final highlights: dew on grass (upper half)
  g.globalAlpha = 0.12;
  g.fillStyle = "rgba(255,255,255,0.95)";
  for (let i = 0; i < 20; i++) {
    const x = (i * 97 + randn(i, 9) * 44) % c.width;
    const yy = Math.max(6, turfTop - 2 - (i % 3));
    g.beginPath();
    g.arc(x, yy, 1 + randn(i, x) * 1.2, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}


  


groundCache = { canvas: c, width: Math.ceil(width), height: Math.ceil(height), map };
  return c;
}
