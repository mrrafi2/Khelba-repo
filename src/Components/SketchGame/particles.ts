import { GRAVITY, PARTICLE_LOWEND_SCALE } from "./constants";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  rot?: number;
  angular?: number;
};

export function spawnParticles(arr: Particle[], cx: number, cy: number, count = 12, lowEnd = false) {
  const scale = lowEnd ? PARTICLE_LOWEND_SCALE : 1;
  for (let i = 0; i < Math.floor(count * scale); i++) {
    const speed = 80 + Math.random() * 200;
    const ang = Math.random() * Math.PI * 2;
    arr.push({
      x: cx + (Math.random() - 0.5) * 10,
      y: cy + (Math.random() - 0.5) * 10,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed * -0.6 - Math.random() * 40,
      life: 0.5 + Math.random() * 1.2,
      size: 1 + Math.random() * 3,
      color: `rgba(${140 + Math.floor(Math.random() * 80)},${90 + Math.floor(Math.random() * 80)},${60 + Math.floor(Math.random() * 40)},1)`,
      rot: Math.random() * Math.PI,
      angular: (Math.random() - 0.5) * 6,
    });
  }
}

export function updateParticles(arr: Particle[], dt: number) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.vy += GRAVITY * 0.02 * dt * 60;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot! += (p.angular || 0) * dt;
    p.life -= dt;
    if (p.life <= 0) arr.splice(i, 1);
  }
}

// shards reuse Particle for simplicity but with bigger size
export function spawnShards(arr: Particle[], cx: number, cy: number, count = 8) {
  for (let i = 0; i < count; i++) {
    arr.push({
      x: cx + (Math.random() - 0.5) * 12,
      y: cy + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 260,
      vy: -Math.random() * 160,
      life: 0.8 + Math.random() * 0.9,
      size: 3 + Math.random() * 4,
      color: "rgba(60,60,60,0.95)",
      rot: Math.random() * Math.PI,
      angular: (Math.random() - 0.5) * 8,
    });
  }
}

