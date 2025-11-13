// src/Components/RunnerGame/utils.ts
export type Point = { x: number; y: number };

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
export function dist(a: Point, b: Point) {
  const dx = a.x - b.x,
    dy = a.y - b.y;
  return Math.hypot(dx, dy);
}


export function randn(x: number, y: number, seed = 0) {
  return Math.abs(Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453) % 1;
}

// stable integer random in [a, b)
export function rndInt(a: number, b: number) {
  return Math.floor(a + Math.abs(Math.sin((a + b) * 12.9898) * 43758.5453) % (b - a));
}

// non-deterministic small range helper (useful elsewhere)
export function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// nextId helper (optional, kept here if needed)
let _id = 1;
export function nextId() {
  return _id++;
}

// image loader helper (if you used it elsewhere)
export async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
  });
}
