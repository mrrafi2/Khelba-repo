// src/Components/RunnerGame/weather.ts
// Fixed: functions are defensive about missing/undefined refs so callers that
// accidentally call stopWeather() without args won't crash the app.
import { rndInt } from "./utils";
import type { WeatherType } from "./types";

/**
 * Start weather on the provided weatherRef.
 * @param now number - current timestamp (performance.now())
 * @param weatherRef - React ref object containing weather state (required)
 * @param type WeatherType
 * @param durationMs number
 * @param intensity number
 */
export function startWeather(
  now: number,
  weatherRef: any,
  type: WeatherType,
  durationMs: number,
  intensity = 0.6
) {
  if (!weatherRef || !weatherRef.current) return;
  const w = weatherRef.current;
  w.active = true;
  w.type = type;
  w.endTime = now + durationMs;
  w.intensity = Math.max(0.15, Math.min(1, intensity));
  w.particles = [];
  w.lastEmit = 0;
  w.nextCheck = w.endTime + rndInt(6000, 15000);
}

/**
 * Stop (and reset) weather. Accepts an optional weatherRef.
 * If no weatherRef is given or it's invalid, this becomes a no-op (safe).
 */
export function stopWeather(weatherRef?: any) {
  if (!weatherRef || !weatherRef.current) return;
  const w = weatherRef.current;
  w.active = false;
  w.type = null;
  w.particles.length = 0;
  w.endTime = 0;
  w.lastEmit = 0;
  w.nextCheck = performance.now() + rndInt(6000, 14000);
}

/**
 * Maybe toggle weather based on schedule and map. Uses startWeatherFn to create weather.
 * @param now number
 * @param weatherRef React ref (required)
 * @param selectedMap string
 * @param startWeatherFn function to actually start the weather (signature: startWeather(now, weatherRef, type, dur, intensity))
 */
export function maybeToggleWeather(
  now: number,
  weatherRef: any,
  selectedMap: string,
  startWeatherFn: (now: number, weatherRef: any, type: WeatherType, dur: number, intensity?: number) => void
) {
  if (!weatherRef || !weatherRef.current) return;
  const w = weatherRef.current;
  if (w.active && now >= w.endTime) {
    stopWeather(weatherRef);
    return;
  }
  if (!w.active && now >= w.nextCheck) {
    let prob = 0.08;
    let type: WeatherType | null = null;
    if (selectedMap === "arctic") { prob = 0.26; type = "snow"; }
    if (selectedMap === "haunted") { prob = 0.18; type = "rain"; }
    if (Math.random() < prob) {
      const dur = rndInt(3800, 14000);
      const intensity = 0.45 + Math.random() * 0.5;
      // call provided starter
      startWeatherFn(now, weatherRef, type!, dur, intensity);
    } else {
      w.nextCheck = now + rndInt(4000, 12000);
    }
  }
}

/**
 * Emit new weather particles into weatherRef based on type/intensity.
 * @param now number
 * @param vw number
 * @param vh number
 * @param groundTop number
 * @param weatherRef React ref (required)
 */
export function emitWeather(
  now: number,
  vw: number,
  vh: number,
  groundTop: number,
  weatherRef: any
) {
  if (!weatherRef || !weatherRef.current) return;
  const w = weatherRef.current;
  if (!w.active || !w.type) return;

  const elapsedSinceLast = Math.max(1, now - (w.lastEmit || now));
  const baseRate = w.type === "rain" ? 120 : 38;
  const perFrame = Math.ceil((baseRate * w.intensity) * (elapsedSinceLast / 1000));
  w.lastEmit = now;

  const cap = w.type === "snow" ? 420 : w.type === "rain" ? 700 : 300;
  if (w.particles.length > cap) return;

  for (let i = 0; i < perFrame; i++) {
    if (w.particles.length > cap) break;
    if (w.type === "snow") {
      const x = rndInt(-40, Math.ceil(vw + 40));
      const y = -rndInt(0, 120);
      const speedY = 20 + Math.random() * 46 * w.intensity;
      const vx = Math.sin(Math.random() * Math.PI * 2) * 24 * w.intensity;
      const size = 2 + Math.random() * 5 * w.intensity;
      w.particles.push({ x, y, vx, vy: speedY, size, alpha: 0.6 + Math.random() * 0.4, kind: 0 });
    } else if (w.type === "rain") {
      const x = rndInt(-40, Math.ceil(vw + 40));
      const y = -rndInt(0, 160);
      const vy = 420 + Math.random() * 320 * w.intensity;
      const vx = -60 + Math.random() * -40;
      const len = 10 + Math.random() * 18 * Math.max(0.6, w.intensity);
      w.particles.push({ x, y, vx, vy, size: len, alpha: 0.35 + Math.random() * 0.25, kind: 0 });
    }
  }
}

/**
 * Update weather particles and draw them onto ctx.
 * @param now number
 * @param ctx CanvasRenderingContext2D
 * @param vw number
 * @param vh number
 * @param groundTop number
 * @param weatherRef React ref (required)
 * @param particlesRef React ref for general particles (required) - used for splashes
 * @param selectedMap string
 * @param startWeatherFn function (passed through to maybeToggleWeather)
 */
export function updateWeather(
  now: number,
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  groundTop: number,
  weatherRef: any,
  particlesRef: any,
  selectedMap: string,
  startWeatherFn: (now: number, weatherRef: any, type: WeatherType, dur: number, intensity?: number) => void
) {
  if (!weatherRef || !weatherRef.current) return;
  maybeToggleWeather(now, weatherRef, selectedMap, startWeatherFn);
  const w = weatherRef.current;
  if (!w.active || !w.type) return;
  emitWeather(now, vw, vh, groundTop, weatherRef);

  for (let i = w.particles.length - 1; i >= 0; i--) {
    const p = w.particles[i];
    if (w.type === "snow") {
      p.x += p.vx;
      p.y += p.vy;
      p.vx += Math.sin((p.y + now) / 600) * 0.3;
      p.vy += 4 * (0.4 + w.intensity * 0.8) * (1 / 60);
      if (p.y > groundTop + 6) {
        w.particles.splice(i, 1);
        continue;
      }
    } else if (w.type === "rain") {
      p.x += p.vx;
      p.y += p.vy * (1 / 60);
      if (p.y > groundTop - 4) {
        const splashCount = 2 + Math.round(Math.random() * 3 * w.intensity);
        for (let s = 0; s < splashCount; s++) {
          const sx = p.x + (Math.random() - 0.5) * 8;
          const sy = groundTop - 6 + Math.random() * 6;
          particlesRef.current.push({ x: sx, y: sy, vx: (Math.random() - 0.5) * 80, vy: -120 - Math.random() * 80, life: 0.28 + Math.random() * 0.4 });
        }
        w.particles.splice(i, 1);
        continue;
      }
      if (p.x < -80 || p.x > vw + 80 || p.y > vh + 80) {
        w.particles.splice(i, 1);
        continue;
      }
    }
  }

  ctx.save();
  if (w.type === "snow") {
    ctx.fillStyle = `rgba(230,240,255,${0.02 * w.intensity})`;
    ctx.fillRect(0, 0, vw, vh);
    for (let p of w.particles) {
      ctx.globalAlpha = Math.max(0.12, p.alpha || 0.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${ctx.globalAlpha})`;
      ctx.fill();
      ctx.globalAlpha = ctx.globalAlpha * 0.6;
      ctx.beginPath();
      ctx.arc(p.x - 1, p.y - 1, Math.max(0.5, p.size * 0.45), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,240,255,${ctx.globalAlpha})`;
      ctx.fill();
    }
  } else if (w.type === "rain") {
    ctx.fillStyle = `rgba(20,30,40,${0.04 * w.intensity})`;
    ctx.fillRect(0, 0, vw, vh);
    ctx.lineCap = "round";
    for (let p of w.particles) {
      ctx.globalAlpha = Math.max(0.18, p.alpha || 0.3) * w.intensity;
      ctx.strokeStyle = `rgba(180,210,230,${ctx.globalAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (p.vx * 0.02), p.y + p.size);
      ctx.stroke();
      ctx.globalAlpha = ctx.globalAlpha * 0.3;
      ctx.fillStyle = `rgba(200,230,255,${ctx.globalAlpha})`;
      ctx.beginPath();
      ctx.ellipse(p.x + (p.vx * 0.02) * 0.6, p.y + p.size, 1.4, 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
