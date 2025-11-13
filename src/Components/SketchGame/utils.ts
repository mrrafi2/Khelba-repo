// utils.ts
import type { Point, Danger } from "./types";

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
export function dist(a: Point, b: Point) {
  const dx = a.x - b.x,
    dy = a.y - b.y;
  return Math.hypot(dx, dy);
}
export function pointToSegmentDistance(p: Point, v: Point, w: Point) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return dist(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
  return dist(p, proj);
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSmoothPath2D(pts: Point[]): Path2D {
  const path = new Path2D();
  if (!pts || pts.length < 2) return path;
  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    path.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  const last = pts[pts.length - 1];
  path.lineTo(last.x, last.y);
  return path;
}

export function collideDangers(a: Danger, b: Danger): void {
  const ra = Math.max(a.width, a.height) / 2;
  const rb = Math.max(b.width, b.height) / 2;
  const ax = a.x + a.width / 2,
    ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2,
    by = b.y + b.height / 2;
  const dx = bx - ax,
    dy = by - ay;
  const distSq = dx * dx + dy * dy;
  const minDist = ra + rb;
  if (distSq < minDist * minDist && distSq > 0.0001) {
    const dAct = Math.sqrt(distSq);
    const nx = dx / dAct,
      ny = dy / dAct;
    const rvx = b.vx - a.vx,
      rvy = b.vy - a.vy;
    const rel = rvx * nx + rvy * ny;
    if (rel > 0) return;
    const e = 0.35; // restitution
    const j = (-(1 + e) * rel) / (1 / a.mass + 1 / b.mass);
    const jx = j * nx,
      jy = j * ny;
    a.vx -= jx / a.mass;
    a.vy -= jy / a.mass;
    b.vx += jx / b.mass;
    b.vy += jy / b.mass;
    const percent = 0.12;
    const correction = Math.max(minDist - dAct, 0.01);
    a.x -= (correction / a.mass) * nx * percent;
    a.y -= (correction / a.mass) * ny * percent;
    b.x += (correction / b.mass) * nx * percent;
    b.y += (correction / b.mass) * ny * percent;
  }
}

export async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res) => {
    const img = new Image();
    img.src = src;
    img.onload = () => res(img);
    img.onerror = () => res(img);
  });
}


export function randn(seed: number, alt = 0): number {
  const s = (Math.floor(seed) * 374761393) ^ (Math.floor(alt) * 668265263);
  const prng = mulberry32(s >>> 0);
  return prng() * 2 - 1; // map [0,1) -> [-1,1)
}

export function rndInt(min: number, max: number) {
  const mn = Math.floor(min);
  const mx = Math.floor(max);
  if (mx <= mn) return mn;
  // use a simple deterministic seed based on inputs
  const seed = (mn * 1664525) ^ (mx * 1013904223);
  const prng = mulberry32(seed >>> 0);
  return mn + Math.floor(prng() * (mx - mn));
}
