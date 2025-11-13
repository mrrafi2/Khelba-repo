import { drawHillsForMap } from "./hills";
import { drawTreesForMap } from "./trees";
import type { ImgMap } from "./types";
import type { MapKey } from "./config";
import type { MutableRefObject } from "react";

export function rebuildParallaxLayers(
  viewW: number,
  viewH: number,
  groundTop: number,
  map: MapKey,
  assetsRef: MutableRefObject<ImgMap>,
  bgCanvasRef: MutableRefObject<HTMLCanvasElement | null>,
  hillsCanvasRef: MutableRefObject<HTMLCanvasElement | null>,
  treesCanvasRef: MutableRefObject<HTMLCanvasElement | null>,
  parallaxMetaRef: MutableRefObject<{ map?: MapKey; width?: number; height?: number }>,
  treesArr?: { x: number; scale: number }[],
) {
  const stripW = Math.max(Math.ceil(viewW), 512) * 2;
  const stripH = viewH;

  const meta = parallaxMetaRef.current;
  if (meta.map === map && meta.width === stripW && meta.height === stripH) return;

  // BG strip
  const bgImg = assetsRef.current["bg"];
  const bgC = document.createElement("canvas");
  bgC.width = stripW;
  bgC.height = stripH;
  const bgCtx = bgC.getContext("2d");
  if (bgCtx) {
    bgCtx.clearRect(0, 0, stripW, stripH);
    if (bgImg && bgImg.width && bgImg.height) {
      const scale = stripH / bgImg.height;
      const drawW = Math.round(bgImg.width * scale);
      const drawH = Math.round(bgImg.height * scale);
      for (let x = 0; x < stripW; x += drawW) {
        try {
          bgCtx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, x, 0, drawW, drawH);
        } catch {
          // fallback: stretch once and stop
          bgCtx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, 0, 0, stripW, stripH);
          break;
        }
      }
    } else {
      const sky = bgCtx.createLinearGradient(0, 0, 0, stripH);
      sky.addColorStop(0, "#dff3ff");
      sky.addColorStop(0.6, "#bfe9ff");
      sky.addColorStop(1, "#8fcfff");
      bgCtx.fillStyle = sky;
      bgCtx.fillRect(0, 0, stripW, stripH);
    }
  }

  // Hills strip
  const hc = document.createElement("canvas");
  hc.width = stripW;
  hc.height = stripH;
  const hctx = hc.getContext("2d");
  if (hctx) {
    hctx.clearRect(0, 0, stripW, stripH);
    try { drawHillsForMap(hctx, map, stripW, stripH); } catch {}
  }

  // Trees strip (only draw if caller supplied a precomputed treesArr)
  const tc = document.createElement("canvas");
  tc.width = stripW;
  tc.height = stripH;
  const tctx = tc.getContext("2d");
  if (tctx) {
    tctx.clearRect(0, 0, stripW, stripH);
    try {
      if (treesArr && treesArr.length) {
        drawTreesForMap(tctx, map, treesArr, groundTop);
      }
      // otherwise leave blank — GameCanvas is expected to draw trees directly (avoids duplicate cache)
    } catch {}
  }

  bgCanvasRef.current = bgC;
  hillsCanvasRef.current = hc;
  treesCanvasRef.current = tc;
  parallaxMetaRef.current = { map, width: stripW, height: stripH };
}
