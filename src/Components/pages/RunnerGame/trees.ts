import { randn, rndInt } from "./utils";
import type { MapKey } from "./config";

type AssetCache = Record<string, HTMLImageElement[]>;

const TREE_ASSET_FILENAMES: Record<string, string[]> = {
  desert: [
    "desert tree-1.png",
    "desert tree-2.png",
    "desert tree=3.png", 
    "desert tree-4.png",
    "desert tree-5.png",
    "desert tree-6.png",
    "desert tree-7.png",
    "desert tree-8.png"
  ],
  arctic: [
    "arctic tree-2.png","arctic tree-3.png","arctic tree-4.png",
    "arctic tree-5.png","arctic tree-6.png","arctic tree-7.png","arctic tree-8.png"
  ],
  beach: [
    "beach tree-1.png","beach tree-2.png","beach tree-3.png","beach tree-4.png","beach tree-5.png"
  ],
  haunted: [
    "haunted tree-1.png","haunted tree-2.png","haunted tree-3.png","haunted tree-4.png","haunted tree-5.png"
  ],
  meadow: [
    "meadow tree-1.png","meadow tree-3.png","meadow tree-4.png",
    "meadow tree-6.png","meadow tree-8.png","meadow tree-9.png"
  ],
  bangu: [] ,
  forest: [
    "forest tree-1.png","forest tree-2.png","meadow tree-1.png","forest tree-4.png",
    "forest tree-5.png",
  ]
};

const TREE_ASSETS: AssetCache = {};

function treeAssetUrl(filename: string) {
  return `/assets/trees/${encodeURIComponent(filename)}`;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
function normalizedMapKey(map: string) {
  if (map === "default") return "meadow";
  return map;
}



export async function preloadTreeAssets(): Promise<void> {

  const maps = Object.keys(TREE_ASSET_FILENAMES);
  for (const m of maps) {
    const list = TREE_ASSET_FILENAMES[m] || [];
    TREE_ASSETS[m] = [];
    for (const fname of list) {
      try {
        const url = treeAssetUrl(fname);
        const img = await loadImg(url);
        TREE_ASSETS[m].push(img);
      } catch (err) {
        // console.warn("Failed to load tree asset:", fname, err);
      }
    }
  }
}

function pickAssetForPos(map: string, x: number): HTMLImageElement | null {
  const key = normalizedMapKey(map);
  const arr = TREE_ASSETS[key];
  if (!arr || arr.length === 0) return null;
  const idx = Math.abs(Math.floor(x * 0.37)) % arr.length;
  const img = arr[idx];
  return img && img.complete ? img : null;
}

const GLOBAL_TREE_ASSET_SCALE = 0.6;
const ASSET_SCALE_BY_MAP: Record<string, number> = {
  desert: 0.55, arctic: 0.65, beach: 0.62, haunted: 0.68, meadow: 0.99, bangu: 0.7, forest: 0.99
};

function tryDrawAsset(ctx: CanvasRenderingContext2D, map: MapKey, x: number, scale: number, groundTop: number): boolean {
  const img = pickAssetForPos(map as string, x);
  if (!img) return false;

  const key = normalizedMapKey(map as string);
  const mapMul = ASSET_SCALE_BY_MAP[key] ?? 0.65;

  // base final scale
  let s = Math.max(0.25, Math.min(1.0, scale * mapMul * GLOBAL_TREE_ASSET_SCALE));

  const MAX_W = 320, MAX_H = 420;
  let drawW = Math.round(img.width * s);
  let drawH = Math.round(img.height * s);

  if (drawW > MAX_W || drawH > MAX_H) {
    const ratio = Math.min(MAX_W / drawW, MAX_H / drawH);
    drawW = Math.round(drawW * ratio);
    drawH = Math.round(drawH * ratio);
  }

  const drawX = Math.round(x - drawW / 2);
  const drawY = Math.round(groundTop - drawH);

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  return true;
}



export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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

function thinTrees(trees: { x: number; scale: number }[], minDistance: number): { x: number; scale: number }[] {
  if (trees.length === 0) return [];

  const sorted = [...trees].sort((a, b) => a.x - b.x);
  const thinned: { x: number; scale: number }[] = [];

  let lastX = -Infinity;
  for (const t of sorted) {
    if (t.x - lastX >= minDistance) {
      thinned.push(t);
      lastX = t.x;
    }
  }

  return thinned;
}




export function drawTreesForMap(
  ctx: CanvasRenderingContext2D,
  map: MapKey,
  trees: { x: number; scale: number }[],
  groundTop: number
) {
  const randnLocal = (a: number, b: number) => randn(a, b);

  // === DESERT MAP ===
  if (map === "desert") {
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i];
      const s = Math.max(0.5, t.scale * 0.66);
    if (tryDrawAsset(ctx, map, t.x, s, groundTop)) continue;

      const trunkX = t.x;
      const trunkY = groundTop - 44 * s;
      const baseW = 11 * s;
      const baseH = 44 * s;

      ctx.save();
      ctx.fillStyle = "#6aa04a";
      ctx.strokeStyle = "#377d34";
      ctx.lineWidth = 2 * s;
      roundRect(ctx, trunkX - baseW / 2, trunkY, baseW, baseH, 5 * s);
      ctx.fill();
      ctx.stroke();

      // Small cactus arms
      ctx.beginPath();
      ctx.ellipse(
        trunkX - baseW,
        trunkY + baseH * 0.3,
        baseW * 0.6,
        baseH * 0.13,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "#75b557";
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(
        trunkX + baseW,
        trunkY + baseH * 0.5,
        baseW * 0.5,
        baseH * 0.12,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "#5b8d3d";
      ctx.fill();

      // Top rounded cap
      ctx.beginPath();
      ctx.ellipse(trunkX, trunkY, baseW, baseW, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#6aa04a";
      ctx.fill();

      // Ground shadow
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.ellipse(trunkX, groundTop + 3 * s, baseW * 1.6, 8 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#836d46";
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // === ARCTIC MAP ===
  else if (map === "arctic") {
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i];
      const s = Math.max(0.5, t.scale * 0.8);
    if (tryDrawAsset(ctx, map, t.x, s, groundTop)) continue;

      const trunkX = t.x;
      const trunkH = 30 * s;
      const trunkY = groundTop - trunkH;
      const trunkW = 6 * s;

      // Tree trunk
      ctx.fillStyle = "#6b452c";
      roundRect(ctx, trunkX, trunkY, trunkW, trunkH, 2 * s);
      ctx.fill();

      // Snowy-green layers
      const layerColors = ["#cce7f5", "#85b6a1", "#3b7a2f"];
      for (let l = 0; l < 3; l++) {
        const yOff = trunkY - 18 * s + l * 12 * s;
        const width = 26 * s - l * 6 * s;
        const height = 18 * s - l * 5 * s;

        ctx.beginPath();
        ctx.moveTo(trunkX - width / 2, yOff + height);
        ctx.quadraticCurveTo(
          trunkX + trunkW / 2,
          yOff - 16 * s,
          trunkX + trunkW + width / 2,
          yOff + height
        );
        ctx.closePath();
        ctx.fillStyle = layerColors[l];
        ctx.globalAlpha = 0.9 - 0.15 * l;
        ctx.fill();
      }

      // Snow base shadow
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.ellipse(trunkX, groundTop + 3 * s, trunkW * 1.8, 6 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#b0c5d1";
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  else  if (map === "bangu") {
    // Draw a row of street lamps / poles + occasional small street trees
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i];
      // use provided x directly (no movement)
      const tx = Math.round(t.x);
      const s = Math.max(0.6, t.scale * 0.9);
  if (tryDrawAsset(ctx, map, t.x, s, groundTop)) continue;

      // street lamp pole
      const poleH = Math.round(48 * s + randnLocal(i, 3) * 18);
      const poleW = Math.max(3, Math.round(4 * s));
      const poleX = tx;
      const poleY = Math.round(groundTop - poleH);

      ctx.save();
      // pole (dark metal)
      ctx.fillStyle = "#2b2b2b";
      roundRect(ctx, poleX - poleW / 2, poleY, poleW, poleH, poleW);
      ctx.fill();

      // lamp head
      ctx.beginPath();
      ctx.fillStyle = "#3b3b3b";
      ctx.ellipse(poleX + 0.5, poleY - 6, 10 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      // faint lamp glass (unlit)
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "#ffdba0";
      ctx.beginPath();
      ctx.ellipse(poleX + 0.5, poleY - 6, 6 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // short street tree near lamp (small canopy)
      if (i % 3 === 0) {
        const tTrunkW = Math.max(4, Math.round(5 * s));
        const tTrunkH = Math.max(18, Math.round(20 * s));
        const tx2 = poleX - Math.round(14 * s);
        const ty2 = groundTop - tTrunkH;
        // trunk
        ctx.fillStyle = "#5a3f2b";
        roundRect(ctx, tx2, ty2, tTrunkW, tTrunkH, 1.5);
        ctx.fill();

        // canopy
        ctx.save();
        ctx.globalAlpha = 0.98;
        ctx.beginPath();
        ctx.ellipse(tx2 + tTrunkW / 2, ty2 - 8 * s, 18 * s, 10 * s, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#36723a";
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    // connect lamp posts with wires (single stroke across)
    if (trees.length >= 2) {
      ctx.save();
      ctx.strokeStyle = "rgba(20,20,22,0.8)";
      ctx.lineWidth = 1;
      let first = true;
      let prevX = 0;
      let prevY = 0;
      for (let i = 0; i < trees.length; i++) {
        const tx = Math.round(trees[i].x);
        const poleH = Math.round(48 * Math.max(0.6, trees[i].scale * 0.9));
        const topY = Math.round(groundTop - poleH - 6);
        if (first) {
          prevX = tx;
          prevY = topY;
          first = false;
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        // slight sag using quadratic curve
        const midX = (prevX + tx) * 0.5;
        const sag = Math.max(6, Math.floor(Math.abs(trees[i].x - prevX) / 20));
        ctx.quadraticCurveTo(midX, Math.min(prevY, topY) + sag, tx, topY);
        ctx.stroke();
        prevX = tx;
        prevY = topY;
      }
      ctx.restore();
    }

    return;
  }

  // === HAUNTED MAP ===
  else if (map === "haunted") {
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i];
      const s = Math.max(0.55, t.scale * 0.8);
        if (tryDrawAsset(ctx, map, t.x, s, groundTop)) continue;

      const trunkX = t.x;
      const trunkH = 34 * s + randnLocal(i, s) * 7;
      const trunkY = groundTop - trunkH;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(trunkX, trunkY);
      ctx.bezierCurveTo(
        trunkX + 6 * s,
        trunkY + trunkH * 0.3,
        trunkX - 4 * s,
        trunkY + trunkH * 0.7,
        trunkX + 3 * s,
        trunkY + trunkH
      );
      ctx.lineWidth = 5 * s;
      ctx.strokeStyle = "#2b241f";
      ctx.stroke();

      // Faint eerie mist / glow
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.ellipse(trunkX, trunkY - 6 * s, 20 * s, 14 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#9b94b3";
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // === DENSE FOREST trees ===
else if (map === "forest") {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;
  const hw = typeof navigator !== "undefined" ? (navigator as any).hardwareConcurrency : undefined;
  const isMobile = /Mobi|Android/i.test(ua);
  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2) || (hw && hw <= 2);

  // colors for varied realistic foliage
  const canopyColors = ["#214d27", "#2f6b36", "#3f7a44", "#265027"];

  for (let i = 0; i < trees.length; i++) {
    const t = trees[i];
    const s = Math.max(0.6, t.scale * (lowEnd ? 0.8 : 0.95));
      if (tryDrawAsset(ctx, map, t.x, s, groundTop)) continue;

    const trunkW = Math.max(6, Math.round(8 * s));
    const trunkH = Math.max(36, Math.round(60 * s));
    const tx = Math.round(t.x);
    const trunkTopY = Math.round(groundTop - trunkH);

    // trunk (textured)
    ctx.save();
    ctx.fillStyle = "#5a3a28";
    roundRect(ctx, tx - trunkW / 2, trunkTopY, trunkW, trunkH, 2 * s);
    ctx.fill();

    // subtle bark lines
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.lineWidth = Math.max(1, Math.round(1 * s));
    for (let b = 0; b < 3; b++) {
      const bx = tx - trunkW / 2 + 2 + b * (trunkW / 3) + (randnLocal(i, b) - 0.5) * 2;
      ctx.beginPath();
      ctx.moveTo(bx, trunkTopY + 4);
      ctx.lineTo(bx + (randnLocal(i + b, 7) - 0.5) * 6, trunkTopY + trunkH - 6);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // canopy — layered clusters of ellipses for dense look
    const canopyLayers = lowEnd ? 2 : 3;
    for (let L = 0; L < canopyLayers; L++) {
      const layerW = 36 * s - L * 6 * s + randnLocal(i, L) * 18 * s;
      const layerH = 20 * s - L * 4 * s + randnLocal(L, i) * 8 * s;
      const offsetX = (randnLocal(i, L) - 0.5) * 12 * s;
      const offsetY = -12 * s - L * 10 * s;
      const cx = tx + offsetX;
      const cy = trunkTopY + offsetY;

      // draw several overlapping blobs to break silhouette
      for (let k = 0; k < (lowEnd ? 3 : 6); k++) {
        ctx.beginPath();
        const rx = layerW * (0.8 + randnLocal(i, k) * 0.35);
        const ry = layerH * (0.9 + randnLocal(k, i) * 0.4);
        const px = cx + (k - 2) * (rx * 0.45) + (randnLocal(k, 9) - 0.5) * 8 * s;
        const py = cy + (randnLocal(k, 11) - 0.5) * 6 * s;
        ctx.ellipse(px, py, Math.max(8, rx), Math.max(6, ry), (randnLocal(k, 3) - 0.5) * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = canopyColors[(i + L + k) % canopyColors.length];
        ctx.globalAlpha = 0.92 - L * 0.12 + (randnLocal(i, k) - 0.5) * 0.06;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // hanging vines / small lianas (cheap bezier strokes)
    if (!lowEnd && Math.random() < 0.7) {
      ctx.save();
      ctx.strokeStyle = "rgba(40,80,36,0.9)";
      ctx.lineWidth = 1;
      for (let v = 0; v < 3; v++) {
        const sx = tx + (randnLocal(i, v) - 0.5) * 18 * s;
        const sy = trunkTopY - 8 - randnLocal(i, v + 5) * 12;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx - 6 - randnLocal(i, v) * 8, sy + 10, tx - 8 + randnLocal(v, i) * 8, groundTop - 8, tx - 6 + randnLocal(v + 2, i) * 6);
        ctx.stroke();
      }
      ctx.restore();
    }

    // base details: small mushrooms, ferns, root knobs
    ctx.save();
    const baseCount = lowEnd ? 1 : 4;
    for (let m = 0; m < baseCount; m++) {
      if (Math.random() < 0.7) {
        const bx = tx + rndInt(-12, 12);
        const by = groundTop - rndInt(2, 8);
        // tiny mushroom cap
        ctx.globalAlpha = 0.96;
        ctx.fillStyle = m % 2 ? "#d84b4b" : "#ffb86e";
        ctx.beginPath();
        ctx.ellipse(bx, by - 2, 3 + randnLocal(m, i) * 3, 2 + randnLocal(i, m) * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // stem
        ctx.fillStyle = "#f7e6d2";
        ctx.fillRect(bx - 0.5, by - 1, 1, 4);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    ctx.restore();
  }
}


// === BEACH trees (coconut palms) ===
else if (map === "beach") {
  // local device heuristics
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined;
  const hw = typeof navigator !== "undefined" ? (navigator as any).hardwareConcurrency : undefined;
  const isMobile = /Mobi|Android/i.test(ua);
  const lowEnd = isMobile || (deviceMemory && deviceMemory <= 2) || (hw && hw <= 2);

  for (let i = 0; i < trees.length; i++) {
    const t = trees[i];
    const s = Math.max(0.7, t.scale * (lowEnd ? 0.85 : 1));
      if (tryDrawAsset(ctx, map, t.x, s, groundTop)) continue;

    const baseX = Math.round(t.x);
    const trunkH = Math.max(60, Math.round(80 * s));
    const trunkW = Math.max(6, Math.round(6 * s));
    const groundY = Math.round(groundTop);

    // generate a slight lean to make palms look natural
    const lean = (randnLocal(i, 3) - 0.5) * 0.6 * s;
    const topX = baseX + Math.round(lean * trunkH * 0.6);
    const topY = groundY - trunkH;

    // trunk: stroked thick curved path (gives smooth tapered trunk)
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#7b4f2f";
    ctx.lineWidth = trunkW;
    ctx.beginPath();
    ctx.moveTo(baseX, groundY);
    // a two-control-point curve for a natural bend
    ctx.bezierCurveTo(
      baseX + lean * 18 * s,
      groundY - trunkH * 0.35,
      baseX + lean * 36 * s,
      groundY - trunkH * 0.72,
      topX,
      topY
    );
    ctx.stroke();

    // add subtle rings / texture on trunk (short arcs)
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = Math.max(1, Math.round(1 * s));
    for (let r = 0; r < 6; r++) {
      const ry = groundY - (r / 6) * trunkH - rndInt(0, 6);
      ctx.beginPath();
      ctx.moveTo(baseX - 6 * s, ry);
      ctx.quadraticCurveTo(baseX + lean * 6, ry - 2 - r, baseX + 6 * s, ry);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // canopy: multiple long fronds around the top point
    const frondCount = lowEnd ? 4 : 7;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2 + (randnLocal(i, f) - 0.5) * 0.5;
      const len = 36 * s + randnLocal(i, f + 7) * 18 * s;
      const fw = 8 * s + randnLocal(f, i) * 4 * s;
      // compute frond tip
      const fx = topX + Math.cos(angle) * len;
      const fy = topY + Math.sin(angle) * (len * 0.5);

      // draw leaf as a filled stretched ellipse rotated by angle
      ctx.save();
      ctx.translate((topX + fx) * 0.5, (topY + fy) * 0.5);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, len * 0.5, Math.max(6, fw), 0, 0, Math.PI * 2);
      ctx.fillStyle = "#2f8b45";
      ctx.globalAlpha = 0.96 - Math.abs(Math.sin(angle)) * 0.12;
      ctx.fill();
      ctx.restore();

      // central midrib (thin stroke)
      ctx.save();
      ctx.strokeStyle = "rgba(20,60,20,0.95)";
      ctx.lineWidth = Math.max(1, Math.round(0.9 * s));
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(
        topX + (fx - topX) * 0.45 + randnLocal(f, i) * 6,
        topY + (fy - topY) * 0.45 - randnLocal(i, f) * 6,
        fx,
        fy
      );
      ctx.stroke();
      ctx.restore();
    }

    // coconuts cluster under canopy
    if (Math.random() < 0.9) {
      ctx.save();
      ctx.fillStyle = "#6b3f1f";
      const coconutCount = rndInt(2, 4);
      for (let c = 0; c < coconutCount; c++) {
        const cx = topX + rndInt(-8, 8);
        const cy = topY + rndInt(-4, 10);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 3 + randnLocal(i, c) * 2, 2.5 + randnLocal(c, i) * 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ground shadow to anchor tree
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#6a4f36";
    ctx.beginPath();
    ctx.ellipse(baseX + lean * 6, groundY + 4, 24 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.restore();
  }
}


  // === DEFAULT MAP (MEADOW) ===
  else {
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i];
      const s = Math.max(0.5, t.scale * 0.78);
     if (tryDrawAsset(ctx, map, t.x, s, groundTop)) continue;

      const trunkW = 7 * s;
      const trunkH = 28 * s;
      const trunkX = t.x;
      const trunkY = groundTop - trunkH;

      // Ground shadow
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = "#172815";
      ctx.beginPath();
      ctx.ellipse(trunkX + trunkW / 2, groundTop + 3, trunkW * 1.8, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Trunk
      ctx.fillStyle = "#6f4730";
      roundRect(ctx, trunkX, trunkY, trunkW, trunkH, 2 * s);
      ctx.fill();

      // Canopy
      const canopyX = trunkX + trunkW / 2;
      const canopyY = trunkY - 10 * s;

      ctx.beginPath();
      ctx.ellipse(canopyX, canopyY, 30 * s, 20 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#3b7a3c";
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(canopyX - 5 * s, canopyY - 5 * s, 25 * s, 18 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#2c5e2e";
      ctx.fill();
    }
  }
}
