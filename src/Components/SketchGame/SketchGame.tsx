"use client";

import React, { useEffect, useRef, useState, type JSX } from "react";
import type { Shield, Danger } from "./types";
import { loadImage, dist, pointToSegmentDistance, buildSmoothPath2D, clamp, collideDangers } from "./utils";
import * as C from "./constants";
import { spawnParticles, updateParticles, spawnShards } from "./particles";
import { drawAnchoredShield, drawParticles, drawGroundProcedural } from "./renderers";
import { database } from "../../firebase";
import {useAuth} from "../../context/AuthContext"
import { ref as dbRef, push, set } from "firebase/database";

type Props = {
  onGameOver?: (score: number) => void;
  user?: any;
};

export default function SketchGame ({ onGameOver, user }: Props): JSX.Element {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
const assetsRef = useRef<Record<string, HTMLImageElement | HTMLVideoElement | null>>({});

  const shieldsRef = useRef<Shield[]>([]);
  const dangersRef = useRef<Danger[]>([]);
  const particlesRef = useRef<any[]>([]); 
  const shardsRef = useRef<any[]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const pointerDownRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const spawnIntervalRef = useRef<number>(C.SPAWN_INTERVAL_START);
  const lastSpawnRef = useRef<number>(0);
  const pixelRatioRef = useRef<number>(1);
  const protagonistXRef = useRef<number>(0);
  const heroRef = useRef<any>({});
  const heroStateRef = useRef<{ anim: "idle" | "hurt" | "fall"; t: number }>({ anim: "idle", t: 0 });
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

    const envRef = useRef<string | null>(null); 
  const weatherParticlesRef = useRef<any[]>([]); 
  const envVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({}); 

  const { saveSketchRound } = useAuth();


 
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);


  const lowEnd = typeof navigator !== "undefined" && (navigator as any).hardwareConcurrency <= 2;
  const hitsRef = useRef(0);
  const [hits, setHits] = useState(0);
  const breakSoundRef = useRef<HTMLAudioElement | null>(null);
  const hurtSoundRef = useRef<HTMLAudioElement | null>(null);

    const gameOverCalledRef = useRef(false);

  // CALL onGameOver when gameOver flips true
  useEffect(() => {
    if (!gameOver) {
      // reset guard if new run starts later
      gameOverCalledRef.current = false;
      return;
    }
    if (gameOverCalledRef.current) return;
    gameOverCalledRef.current = true;

    try {
      onGameOver && onGameOver(score);
    } catch (err) {
      console.warn("onGameOver handler error:", err);
    }
  }, [gameOver, score, onGameOver]);



useEffect(() => {
  if (!gameOver) return;
  if (!saveSketchRound) return; // fallback
  (async () => {
    try {
      await saveSketchRound({
        score: scoreRef.current ?? score,
        hits: hitsRef.current ?? hits,
      });
      console.log("Sketch round saved via AuthContext helper");
    } catch (e) {
      console.warn("Save failed", e);
    }
  })();
}, [gameOver]);

  // preload assets
  useEffect(() => {

    (async () => {
      const map: Record<string, HTMLImageElement | null> = {};
      const keys = Object.keys(C.ASSET_MAP) as (keyof typeof C.ASSET_MAP)[];
      for (const k of keys) {
        try {
          map[k] = await loadImage(C.ASSET_MAP[k]);
        } catch {
          map[k] = null;
        }
      }
      map["bg"] = await loadImage(C.BG_SRC).catch(() => null);
      heroRef.current.idle = await loadImage(C.HERO_PATH + C.HERO_POSES.idle).catch(() => undefined);

      heroRef.current.idle2 = await loadImage(C.HERO_PATH + C.HERO_POSES.idle2).catch(() => undefined);

       heroRef.current.hurt = await loadImage(C.HERO_PATH + C.HERO_POSES.hurt).catch(() => undefined);

      heroRef.current.fall = await loadImage(C.HERO_PATH + C.HERO_POSES.fall).catch(() => undefined);
      assetsRef.current = map;

// --- preload & attach looping hero video 
try {
  const v = document.createElement("video");
  v.src = "/assets/chars/hero.webm"; 

  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = "auto";
  v.playsInline = true;
  v.crossOrigin = "anonymous";

  v.style.position = "fixed";
  v.style.left = "-9999px";
  v.style.top = "0";
  v.style.width = "1px";
  v.style.height = "1px";
  v.style.opacity = "0";
  v.setAttribute("aria-hidden", "true");

  (document.body || document.documentElement).appendChild(v);

  // try to start it immediately 
  v.play().catch(() => {
  });

  // store for rendering & reuse
  assetsRef.current["hero_video"] = v;
  heroRef.current.video = v;
} catch (err) {
  //  we'll fall back to sprites if the video can't be created
  console.warn("Hero video preload failed:", err);
}


      try {
        for (const env of (C.ENVS || [])) {
          // ground texture image
          try {
            const img = await loadImage(env.ground);
            assetsRef.current[`ground_${env.key}`] = img;
          } catch {
            assetsRef.current[`ground_${env.key}`] = null;
          }

          // create video element and try to prime it (muted autopplay)
          try {
            const v = document.createElement("video");
            v.muted = true; 
            v.loop = true;
            v.playsInline = true;
            v.preload = "auto";
            v.crossOrigin = "anonymous";
            v.src = env.video;
            v.play().catch(() => {
            });
            assetsRef.current[`video_${env.key}`] = v;
            envVideoRefs.current[env.key] = v;
          } catch (err) {
            assetsRef.current[`video_${env.key}`] = null;
            envVideoRefs.current[env.key] = null;
          }
        }
      } catch (err) {
        // non-fatal: env preloads failed
      }

      try {
        const bs = new Audio(C.BREAK_SOUND_SRC);
        bs.preload = "auto";
        bs.volume = 0.8;
        breakSoundRef.current = bs;
      } catch { /* ignore */ }

      try {
        const hs = new Audio(C.HURT_SOUND_SRC);
        hs.preload = "auto";
        hs.volume = 0.9;
        hurtSoundRef.current = hs;
      } catch { /* ignore */ }

      setLoaded(true);
    })();
  }, []);



  function playBreakSound() {
    const src = breakSoundRef.current?.src;
    if (!src) return;
    try {
      const a = new Audio(src);
      a.currentTime = 0;
      a.volume = breakSoundRef.current?.volume ?? 0.9;
      a.play().catch(() => {});
    } catch { /* ignore */ }
  }

  function playHurtSound () {
    const src = hurtSoundRef.current?.src;
    if (!src) return;

    try {
      const a = new Audio(src);
      a.currentTime = 0;
      a.volume = hurtSoundRef.current?.volume ?? 0.9;
      a.play().catch(() => {});
    } catch { /* ignore */ }
  }

  useEffect(() => {
  return () => {
    const hv = assetsRef.current && (assetsRef.current["hero_video"] as HTMLVideoElement | undefined);
    if (hv) {
      try {
        hv.pause();
        if (hv.parentNode) hv.parentNode.removeChild(hv);
      } catch { /* ignore */}
    }
  };
}, []);


  const DESKTOP_CANVAS_WIDTH = 500; 
const DESKTOP_MAX_HEIGHT = 1000; 

  // sizing
  
useEffect(() => {
  const canvas = canvasRef.current!;
  if (!canvas) return;

  // mobile detection (reuse of earlier const is fine too)
  const isMob = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

  function computeViewportSize() {

    const vv = (typeof window !== "undefined" && (window as any).visualViewport) ? (window as any).visualViewport : null;
    const vw = vv ? vv.width : window.innerWidth;
    const vh = vv ? vv.height : window.innerHeight;
    return { vw: Math.max(1, Math.floor(vw)), vh: Math.max(1, Math.floor(vh)) };
  }

  function resize() {

    const dpr = window.devicePixelRatio || 1;
    pixelRatioRef.current = dpr;

    const { vw, vh } = computeViewportSize();

    let cssWidth: number | string;
    let cssHeight: number | string;

if (isMob) {
  cssWidth = "100%";
  cssHeight = "100%";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.right = "0";
  canvas.style.bottom = "0";
  canvas.style.margin = "0";
  canvas.style.borderRadius = "0";
  canvas.style.boxShadow = "none";
  canvas.classList.add("canvas-fullscreen");
} else {
  // desktop behaviour (unchanged)
  const cssW = DESKTOP_CANVAS_WIDTH;
  const cssH = Math.min(window.innerHeight * 0.82, DESKTOP_MAX_HEIGHT);
  cssWidth = `${cssW}px`;
  cssHeight = `${cssH}px`;
  canvas.classList.remove("canvas-fullscreen");
  canvas.style.position = "";
  canvas.style.top = "";
  canvas.style.left = "";
  canvas.style.right = "";
  canvas.style.bottom = "";
  canvas.style.margin = "";
}

    canvas.style.width = typeof cssWidth === "number" ? `${cssWidth}px` : cssWidth;
    canvas.style.height = typeof cssHeight === "number" ? `${cssHeight}px` : cssHeight;

    const bb = canvas.getBoundingClientRect();
    canvas.width = Math.floor(bb.width * dpr);
    canvas.height = Math.floor(bb.height * dpr);

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    protagonistXRef.current = bb.width / 2;
  }

  // initial call
  resize();

  const vv = (typeof window !== "undefined" && (window as any).visualViewport) ? (window as any).visualViewport : null;
  if (vv) {
    vv.addEventListener("resize", resize);
    vv.addEventListener("scroll", resize);
  }
  window.addEventListener("resize", resize);

  return () => {
    if (vv) {
      vv.removeEventListener("resize", resize);
      vv.removeEventListener("scroll", resize);
    }
    window.removeEventListener("resize", resize);
  };
}, [loaded]);

  // pointer drawing
  // ---------- Pointer drawing useEffect (REPLACEMENT) ----------
useEffect(() => {
  if (!loaded) return;
  const canvas = canvasRef.current!;
  if (!canvas) return;

  function getPointFromEvent(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // Shared completion logic (extracted from your original onPointerUp code)
  function processCompletedPath(pts: { x: number; y: number }[]) {
    if (!pts || pts.length <= 2) return;
    const length = pts.reduce((acc, _, i) => (i === 0 ? 0 : acc + dist(pts[i], pts[i - 1])), 0);
    const thickness = Math.min(34, Math.max(4, 4 + length / 28));
    const area = length * thickness;
    const durability = Math.max(60, Math.min(520, Math.floor(area * 0.68)));

    const bb = canvas.getBoundingClientRect();
    const groundTop = bb.height - Math.max(60, Math.min(140, bb.height * 0.12));

    // check anchor candidate: must touch ground near bottom
    let anchored = false;
    for (const p of pts) {
      if (p.y >= groundTop - 8) {
        anchored = true;
        break;
      }
    }

    const heroX = protagonistXRef.current;
    const heroY = groundTop - C.HERO_OFFSET;
    let violatesHeroZone = false;
    for (const p of pts) {
      if (Math.hypot(p.x - heroX, p.y - heroY) <= C.HERO_PROTECTED_RADIUS) {
        violatesHeroZone = true;
        break;
      }
    }

    if (!anchored || violatesHeroZone) {
      // shards + particles for free-floating strokes
      const shards = convertPathToShards(pts, thickness);
      shards.forEach((sh) => shardsRef.current.push(sh));
      spawnParticles(particlesRef.current, shards.length ? shards[0].x : bb.width / 2, shards.length ? shards[0].y : groundTop - 8, violatesHeroZone ? 18 : 12, lowEnd);
    } else {
      // anchored - same existing behavior
      const s: Shield = {
        id: C.nextShieldId(),
        points: pts,
        thickness,
        maxDurability: durability,
        durability,
        anchored: true,
        createdAt: performance.now(),
      };
      shieldsRef.current.push(s);
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button && e.button !== 0) return;
    if (gameOver || !isStarted) return;
    e.preventDefault();
    const pt = getPointFromEvent(e);

    // hero protected circle check (prevent starting inside)
    const rect = canvas.getBoundingClientRect();
    const heroX = protagonistXRef.current;
    const heroY = rect.height - groundHeight(rect) - C.HERO_OFFSET;
    if (Math.hypot(pt.x - heroX, pt.y - heroY) <= C.HERO_PROTECTED_RADIUS) {
      // small feedback: burst a few particles so player knows it's blocked
      spawnParticles(particlesRef.current, pt.x, pt.y, 8, lowEnd);
      return;
    }

    pointerDownRef.current = true;
    currentPathRef.current = [pt];
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch { /* ignore */ }
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointerDownRef.current) return;
    e.preventDefault();
    const pt = getPointFromEvent(e);
    const rect = canvas.getBoundingClientRect();
    const heroX = protagonistXRef.current;
    const heroY = rect.height - groundHeight(rect) - C.HERO_OFFSET;

    if (Math.hypot(pt.x - heroX, pt.y - heroY) <= C.HERO_PROTECTED_RADIUS) {
      pointerDownRef.current = false;

      try {
  const pid = (e as any).pointerId;
  if (pid !== null && pid !== undefined) {
    canvas.releasePointerCapture(pid);
  }
} catch { /* ignore */ }

// process whatever was drawn so far
      const pts = currentPathRef.current.slice();
      currentPathRef.current = [];
      processCompletedPath(pts);
      // feedback to show blocked crossing
      spawnParticles(particlesRef.current, heroX, heroY, 8, lowEnd);
      return;
    }

    // normal add point
    currentPathRef.current.push(pt);
  }

  function onPointerUp(e: PointerEvent) {
    if (!pointerDownRef.current && currentPathRef.current.length <= 1) {
      // nothing to do
      try { canvas.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      currentPathRef.current = [];
      pointerDownRef.current = false;
      return;
    }
    e.preventDefault();
    pointerDownRef.current = false;
    const pts = currentPathRef.current.slice();
    currentPathRef.current = [];
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    processCompletedPath(pts);
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
  };
}, [loaded, gameOver, isStarted]);

  // click-to-damage dangers
  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    function onClick(e: MouseEvent) {
      if (gameOver || !isStarted) return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left,
        py = e.clientY - r.top;
      for (let i = dangersRef.current.length - 1; i >= 0; i--) {
        const d = dangersRef.current[i];
        if (px >= d.x && px <= d.x + d.width && py >= d.y && py <= d.y + d.height) {
          const clickDmg = Math.max(1, Math.round(d.maxHp / 6));
          d.hp -= clickDmg;
          d.clickedTimes++;
          d.vy -= 1.8;
          d.angularVel += (Math.random() - 0.5) * 1.0;
          spawnParticles(particlesRef.current, d.x + d.width / 2, d.y + d.height / 2, 10, lowEnd);
          if (d.hp <= 0) {
            playBreakSound();
            spawnParticles(particlesRef.current, d.x + d.width / 2, d.y + d.height / 2, 20, lowEnd);
            spawnShards(shardsRef.current, d.x + d.width / 2, d.y + d.height / 2, 10);
            dangersRef.current.splice(i, 1);
          }
          break;
        }
      }
    }
    canvas.addEventListener("mousedown", onClick);
    return () => canvas.removeEventListener("mousedown", onClick);
  }, [gameOver, isStarted, lowEnd]);

  // helpers for shards/particles conversion
  function spawnShardsAt(cx: number, cy: number, count = 8) {
    spawnShards(shardsRef.current, cx, cy, count);
  }
  function spawnParticlesAt(cx: number, cy: number, count = 12) {
    spawnParticles(particlesRef.current, cx, cy, count, lowEnd);
  }
  function convertPathToShards(path: { x: number; y: number }[], thickness: number) {
    const shards: any[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i],
        b = path[i + 1];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const len = Math.hypot(a.x - b.x, a.y - b.y);
      const count = Math.max(1, Math.floor(len / 12));
      for (let j = 0; j < count; j++) {
        shards.push({
          x: mid.x + (Math.random() - 0.5) * 6,
          y: mid.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 120,
          vy: -10 + Math.random() * -50,
          life: 0.6 + Math.random() * 1.0,
          size: Math.max(2, Math.min(8, thickness / 3)),
        });
      }
    }
    return shards;
  }

  function groundHeight(rect: DOMRect) {
    return Math.max(60, Math.min(140, rect.height * 0.12));
  }

  function updateAndDrawWeather(ctx: CanvasRenderingContext2D, rect: DOMRect, dt: number) {
    const arr = weatherParticlesRef.current;
    if (!arr || arr.length === 0) return;
    // update & draw
    ctx.save();
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      // update physics
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      // wrap / reset bottom -> top
      if (p.y > rect.height + 20 || p.x < -40 || p.x > rect.width + 40) {
        p.x = Math.random() * rect.width;
        p.y = -10 - Math.random() * 80;
      }
      // draw
      if (p.type === "rain") {
        ctx.globalAlpha = 0.38;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (p.vx * 0.03), p.y + p.len);
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "rgba(180,200,230,0.95)";
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.type === "snow") {
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.type === "sand") {
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(210,160,110,0.95)";
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

    // --- WEATHER: cheap particles for rain / snow (very lightweight) ---
  function initWeatherForEnv(envKey: string | null) {
    weatherParticlesRef.current.length = 0;
    if (!envKey) return;
    const env = (C.ENVS || []).find((e) => e.key === envKey);
    if (!env) return;
    const type = env.weather || "none";
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const count = Math.floor(rect.width / (type === "rain" ? 6 : 18)); // rain denser
    for (let i = 0; i < count; i++) {
      if (type === "rain") {
        weatherParticlesRef.current.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: 240 + Math.random() * 120,
          len: 8 + Math.random() * 10,
          type: "rain"
        });
      } else if (type === "snow") {
        weatherParticlesRef.current.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 12,
          vy: 30 + Math.random() * 40,
          r: 1 + Math.random() * 2.4,
          type: "snow"
        });
      } else if (type === "sand") {
        weatherParticlesRef.current.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: -20 + Math.random() * 40,
          vy: 10 + Math.random() * 8,
          r: 1 + Math.random() * 1.6,
          type: "sand"
        });
      }
    }
  }

  // ---------------- Main loop ----------------
  useEffect(() => {
    if (!loaded || !isStarted) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let last = performance.now();
    lastSpawnRef.current = last;

    function spawnDanger(rect: DOMRect, difficulty = 1) {
  // dynamic max: increase allowed active dangers as difficulty rises
  const elapsedSec = startTimeRef.current ? (performance.now() - startTimeRef.current) / 1000 : 0;
  const dynamicMax = Math.min(Math.max(C.MAX_DANGERS, C.MAX_DANGERS + Math.floor(elapsedSec / 12)), 60);
  if (dangersRef.current.length >= dynamicMax) return;

  // Weighted selection: prefer tougher types as difficulty grows
  const keys = Object.keys(C.ASSET_MAP) as (keyof typeof C.ASSET_MAP)[];
  // base weight (lighter types have 1, heavy have higher base)
  const baseWeight: Record<string, number> = {};
  for (const k of keys) baseWeight[k] = 1;
  // bump weights for heavy things (you can tune these)
  ["weight", "rock", "brick_grey", "chain"].forEach((k) => {
    if (baseWeight[k] != null) baseWeight[k] = 1.8;
  });
  // compute adjusted weights by difficulty (heavy items scale more with difficulty)
  const weights = keys.map((k) => {
    const heavyBoost = ["weight", "rock", "chain", "brick_grey"].includes(k as string) ? 0.5 : 0.12;
    return Math.max(0.1, baseWeight[k] * (1 + heavyBoost * (difficulty - 1)));
  });
  // pick weighted key
  const totalW = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalW;
  let chosenKey = keys[0];
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      chosenKey = keys[i];
      break;
    }
  }

  const prop = (C.DANGER_PROPS as any)[chosenKey];
  const img = assetsRef.current[chosenKey] || null;
  const base = 28 * prop.size * (prop.size < 1 ? C.SMALL_SCALE_BOOST : 1);

  const sizeScale = 1 + Math.min(1.2, (difficulty - 1) * 0.08); // gentle growth
  const hpScale = 1 + Math.min(1.6, (difficulty - 1) * 0.18);
  const massScale = 1 + Math.min(1.2, (difficulty - 1) * 0.12);
  const speedScale = 1 + Math.min(1.6, (difficulty - 1) * 0.16);

  let width = clamp(base * sizeScale + Math.random() * base * 0.6, 14, C.LARGE_SIZE_CAP);
  let height = clamp(base * sizeScale + Math.random() * base * 0.6, 14, C.LARGE_SIZE_CAP);
  const x = Math.random() * Math.max(1, rect.width - width);

  const y = -height - Math.random() * (40 + 60 * Math.min(1.6, difficulty * 0.4));
  const vy = (40 * (1.0 + Math.random() * 0.9) / 60) * speedScale;
  const vx = (Math.random() - 0.5) * 0.8 * (1 + (difficulty - 1) * 0.08);
  const rotation = Math.random() * Math.PI * 2;
  const angularVel = (Math.random() - 0.5) * (1.2 + (difficulty - 1) * 0.35);
  const mass = prop.mass * massScale;
  const hp = prop.hp * (1 + Math.random() * 0.18) * hpScale;

  const d: Danger = {
    id: C.nextDangerId(),
    typeKey: chosenKey as any,
    img,
    x,
    y,
    width,
    height,
    vx,
    vy,
    rotation,
    angularVel,
    mass,
    hp,
    maxHp: hp,
    baseDamage: prop.baseDamage,
    clickedTimes: 0,
    broken: false,
  };

  dangersRef.current.push(d);
}

  

   

function step(now: number): void {

  // compute dt (clamped) and update last timestamp
  const dt = Math.min(40, Math.max(0, now - last)) / 1000;
  last = now;

  // protective fetch of rect & ctx; if missing, try again next frame
  const rect = canvas.getBoundingClientRect();
  if (!ctx) {
    if (!gameOver) rafRef.current = requestAnimationFrame(step);
    return;
  }

  // ensure correct transform each frame (fixes DPR/resize disappearance)
  try {
    ctx.setTransform(pixelRatioRef.current, 0, 0, pixelRatioRef.current, 0, 0);
  } catch (err) {
    // setTransform can rarely throw if context lost; bail gracefully
    console.error("setTransform failed:", err);
  }

  // keep protagonist centered if layout changed
  protagonistXRef.current = rect.width / 2;

  try {
    // --- Clear frame ---
    ctx.clearRect(0, 0, rect.width, rect.height);

    
    if (startTimeRef.current != null) {
      const elapsed = Math.max(0, (now - startTimeRef.current) / 1000);
      const elapsedSec = Math.floor(elapsed);
      if (scoreRef.current !== elapsedSec) {
        scoreRef.current = elapsedSec;
        setScore(elapsedSec);
      }
    }

       // --- Background  ---
    const envKey = envRef.current;
    const videoEl = envKey ? (assetsRef.current[`video_${envKey}`] as HTMLVideoElement | null) : null;
    let bgDrawn = false;
    if (videoEl && videoEl.readyState >= 2) {
      try {
        ctx.drawImage(videoEl, 0, 0, rect.width, rect.height);
        bgDrawn = true;
      } catch {/* ignore */}
    }
    if (!bgDrawn) {
      const bgImg = assetsRef.current["bg"];
      if (bgImg) ctx.drawImage(bgImg, 0, 0, rect.width, rect.height);
      else {
        ctx.fillStyle = "#efe9df";
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }

    updateAndDrawWeather(ctx, rect, dt)


    // --- Procedural ground (replaces tile images) ---
drawGroundProcedural(ctx, rect, assetsRef.current, envRef.current);

    if (now - lastSpawnRef.current > spawnIntervalRef.current) {

  const elapsedSec = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;

  const difficulty = 1 + Math.min(6, elapsedSec / 20);

  
  const spawnBatch = Math.min(4, Math.max(1, Math.floor(difficulty))); // at most 4 at once
  for (let b = 0; b < spawnBatch; b++) {
    spawnDanger(rect, difficulty);
  }

  lastSpawnRef.current = now;
  // 3) keep decaying interval for progressive tension (your existing accel still applies)
  spawnIntervalRef.current = Math.max(C.SPAWN_INTERVAL_MIN, spawnIntervalRef.current * C.SPAWN_ACCEL);

  
}

    // --- Update dangers (physics + collisions) ---
    for (let i = dangersRef.current.length - 1; i >= 0; i--) {
      const d = dangersRef.current[i];

      // integrate physics
      d.vy += C.GRAVITY * d.mass * dt * 0.01;
      d.x += d.vx * 60 * dt;
      d.y += d.vy * 60 * dt;
      d.rotation += d.angularVel * dt;

      // broad collisions with other dangers (kept minimal for perf)
      for (let j = 0; j < dangersRef.current.length; j++) {
        if (i === j) continue;
        collideDangers(d, dangersRef.current[j]); // existing function; it's robust
      }

      // shield collisions (anchored shields only)
      let destroyedByShield = false;
      for (let sI = 0; sI < shieldsRef.current.length; sI++) {
        const s = shieldsRef.current[sI];
        if (!s.anchored || s.durability <= 0) continue;
        const center = { x: d.x + d.width / 2, y: d.y + d.height / 2 };
        let collided = false;
        for (let k = 0; k < s.points.length - 1; k++) {
          const a = s.points[k];
          const b = s.points[k + 1];
          const pd = pointToSegmentDistance(center, a, b);
          const threshold = Math.hypot(d.width, d.height) / 2 + s.thickness / 2;
          if (pd <= threshold) {
            collided = true;
            const impact = Math.abs(d.vy) * d.mass;
            const dmg = d.baseDamage * Math.max(0.18, impact * 0.6);
            s.durability = Math.max(0, s.durability - dmg);
            d.hp -= dmg * 0.07;

            if (d.hp <= 0) {
              playBreakSound();
              spawnParticlesAt(d.x + d.width / 2, d.y + d.height / 2, 14);
              spawnShardsAt(d.x + d.width / 2, d.y + d.height / 2, 8);
              dangersRef.current.splice(i, 1);
              destroyedByShield = true;
            } else {
              // bounce and jitter
              d.vy *= C.SHIELD_BOUNCE;
              d.vx += (Math.random() - 0.5) * 0.6;
              d.angularVel += (Math.random() - 0.5) * 0.6;
              spawnParticlesAt(d.x + d.width / 2, d.y + d.height / 2, 6);
            }
            break;
          }
        }
        if (collided) break;
      }
      if (destroyedByShield) continue;

      // ground collision handling
      const gTop = rect.height - groundHeight(rect);
      if (d.y + d.height >= gTop) {
        const heroX = protagonistXRef.current;
        const heroY = gTop - C.HERO_OFFSET;
        const left = d.x;
        const right = d.x + d.width;
        const bottom = d.y + d.height;
        const hitHero = !(right < heroX - 24 || left > heroX + 24 || bottom < heroY - 24);

        if (hitHero) {
          // hero hurt
          heroStateRef.current.anim = "hurt";
          heroStateRef.current.t = 0;
          playHurtSound();
          playBreakSound();
          d.vy *= -0.9;
          d.vx += (Math.random() - 0.5) * 2.2;
          spawnParticlesAt(d.x + d.width / 2, d.y + d.height / 2, 22);
          spawnShardsAt(d.x + d.width / 2, gTop - 6, 10);
          dangersRef.current.splice(i, 1);

          hitsRef.current += 1;
          setHits(hitsRef.current);

          if (hitsRef.current >= C.HERO_MAX_HIT) {
            heroStateRef.current.anim = "fall";
            setGameOver(true);
          }
          continue;
        } else {
          // hit ground harmlessly
          playBreakSound();
          spawnParticlesAt(d.x + d.width / 2, gTop, 18);
          spawnShardsAt(d.x + d.width / 2, gTop - 8, 8);
          dangersRef.current.splice(i, 1);
          continue;
        }
      }
    }

    // --- Shields that reached zero durability: explode into shards/particles ---
    for (let sI = shieldsRef.current.length - 1; sI >= 0; sI--) {
      const s = shieldsRef.current[sI];
      if (s.durability <= 0) {
        playBreakSound();
        const shards = convertPathToShards(s.points, s.thickness);
        shards.forEach((sh) => shardsRef.current.push(sh));
        shieldsRef.current.splice(sI, 1);
      }
    }

    // --- Update particles & shards (physics) ---
    updateParticles(particlesRef.current, dt);
    updateParticles(shardsRef.current, dt);

    // --- Draw dangers ---
    for (let i = 0; i < dangersRef.current.length; i++) {
      const d = dangersRef.current[i];
      ctx.save();
      ctx.translate(d.x + d.width / 2, d.y + d.height / 2);
      ctx.rotate(d.rotation);
      if (d.img) {
        try {
          ctx.drawImage(d.img, -d.width / 2, -d.height / 2, d.width, d.height);
        } catch {
          // defensive: if drawImage fails (rare), fall back to rect
          ctx.fillStyle = "darkred";
          ctx.fillRect(-d.width / 2, -d.height / 2, d.width, d.height);
        }
      } else {
        ctx.fillStyle = "darkred";
        ctx.fillRect(-d.width / 2, -d.height / 2, d.width, d.height);
      }
      const dmgRatio = Math.max(0, 1 - Math.max(0, d.hp / d.maxHp));
      if (dmgRatio > 0.12) {
        ctx.fillStyle = `rgba(0,0,0,${0.06 + dmgRatio * 0.16})`;
        ctx.fillRect(-d.width / 2, -d.height / 2, d.width, d.height);
      }
      ctx.restore();
    }

    // --- Draw anchored shields ---
    for (let i = 0; i < shieldsRef.current.length; i++) {
      drawAnchoredShield(ctx, shieldsRef.current[i]);
    }

    // --- Preview current pointer-drawn path ---
    if (currentPathRef.current.length > 0) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(24,24,24,0.96)";
      ctx.beginPath();
      const path = currentPathRef.current;
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    }

    // --- Protected hero zone indicator ---
    const heroX = protagonistXRef.current;
    const heroY = rect.height - groundHeight(rect) - C.HERO_OFFSET;
    ctx.beginPath();
    ctx.arc(heroX, heroY, C.HERO_PROTECTED_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,40,40,0.04)";
    ctx.fill();

    // --- Shards (fallback draw) + particles ---
    for (let i = 0; i < shardsRef.current.length; i++) {
      const sh = shardsRef.current[i];
      ctx.fillStyle = "rgba(60,60,60,0.95)";
      ctx.fillRect(sh.x, sh.y, sh.size, sh.size);
    }
    drawParticles(ctx, particlesRef.current);

    // --- Draw hero sprite ---
    drawHero(ctx, rect);

    // --- end of main try block ---
  } catch (err) {
    // Prevent RAF from dying and give a useful error message
    console.error("Game loop error:", err);
    // Small visible overlay so you notice in the UI (failsafe wrapped)
    try {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(8, 8, 360, 36);
      ctx.fillStyle = "white";
      ctx.font = "12px sans-serif";
      ctx.fillText("Recoverable game error — see console for details.", 16, 32);
      ctx.restore();
    } catch {/* ignore */}
  } finally {
    // Defensive caps to avoid runaway memory/CPU
    const MAX_PARTICLES = 1500;
    const MAX_SHARDS = 1200;
    const MAX_DANGERS = Math.max(C.MAX_DANGERS, 30);

    if (particlesRef.current.length > MAX_PARTICLES) particlesRef.current.length = MAX_PARTICLES;
    if (shardsRef.current.length > MAX_SHARDS) shardsRef.current.length = MAX_SHARDS;
    if (dangersRef.current.length > MAX_DANGERS) dangersRef.current.length = MAX_DANGERS;

    // schedule next frame if game isn't over
    if (!gameOver) {
      rafRef.current = requestAnimationFrame(step);
    } else {
      // final dim overlay rendered elsewhere; ensure RAF cleared
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }
}

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loaded, gameOver, isStarted]);


function drawHero(ctx: CanvasRenderingContext2D, rect: DOMRect) {

  const heroImgs = heroRef.current;
  const cx = protagonistXRef.current;
  const gh = groundHeight(rect);
  const cy = rect.height - gh - C.HERO_OFFSET;

  // base is derived from canvas width; smaller divisor -> bigger base
  const base = Math.floor(rect.width / 9);

  // widthScale / heightScale: set these to whatever you want (1.0 = base)
  const widthScale = 1;   // increase this to make hero wider
  const heightScale = 1.8;  // increase this to make hero taller

  // clamp final dims so they never grow absurdly large on huge screens
  const width = Math.min(220, Math.max(80, Math.round(base * widthScale)));
  const height = Math.min(260, Math.max(90, Math.round(base * heightScale)));

  
  if (heroStateRef.current.anim === "hurt" && heroImgs.hurt) {
    ctx.drawImage(heroImgs.hurt, cx - width / 2, cy - height / 2, width, height);
    ctx.fillStyle = "rgba(255,40,40,0.12)";
    ctx.fillRect(cx - width / 2, cy - height / 2, width, height);

    heroStateRef.current.t += 1 / 60;
    if (heroStateRef.current.t > 0.28) {
      heroStateRef.current.anim = "idle";
      heroStateRef.current.t = 0;
    }
    return;
  }

  if (heroStateRef.current.anim === "fall" && heroImgs.fall) {
    ctx.drawImage(heroImgs.fall, cx - width / 2, cy - height / 2, width, height);
    return;
  }

  const animMaybe = heroRef.current.video || assetsRef.current["hero_video"] || heroRef.current.gif || assetsRef.current["hero_gif"];
  if (animMaybe) {
    try {
      if (animMaybe instanceof HTMLVideoElement) {
        if (animMaybe.paused) {
          animMaybe.play().catch(() => {});
        }
        ctx.drawImage(animMaybe, cx - width / 2, cy - height / 2, width, height);
        return;
      } else if (animMaybe instanceof HTMLImageElement) {
        ctx.drawImage(animMaybe, cx - width / 2, cy - height / 2, width, height);
        return;
      }
    } catch (err) {
      console.warn("drawHero anim draw error:", err);
    }
  }

  // 3) original idle animation fallback (idle / idle2)
  if (heroImgs.idle2 && heroImgs.idle) {
    const frameDur = 0.5;
    heroStateRef.current.t = (heroStateRef.current.t || 0) + 1 / 60;
    const frameIndex = Math.floor(heroStateRef.current.t / frameDur) % 2;
    const img = frameIndex === 0 ? heroImgs.idle : heroImgs.idle2;
    if (img) {
      ctx.drawImage(img, cx - width / 2, cy - height / 2, width, height);
      return;
    }
  }

  if (heroImgs.idle) {
    ctx.drawImage(heroImgs.idle, cx - width / 2, cy - height / 2, width, height);
  } else {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}


  // restart
  useEffect(() => {
  function onRestartClick() {

    if (!gameOver) return;

    dangersRef.current = [];
    shieldsRef.current = [];
    particlesRef.current = [];
    shardsRef.current = [];
    C.resetIds();
    spawnIntervalRef.current = C.SPAWN_INTERVAL_START;
    lastSpawnRef.current = performance.now();
    scoreRef.current = 0;
    setScore(0);
    hitsRef.current = 0;
    setHits(0);
    setGameOver(false);
    heroStateRef.current.anim = "idle";
    heroStateRef.current.t = 0;
    setIsStarted(false);
    startTimeRef.current = null;


    const prev = envRef.current;
    if (prev) {
      const pv = assetsRef.current[`video_${prev}`] as HTMLVideoElement | null;
      if (pv) {
        try {
          pv.pause();
          pv.currentTime = 0;
        } catch {/* ignore */}
      }
    }

    weatherParticlesRef.current.length = 0;
    envRef.current = null;

  }

  window.addEventListener("click", onRestartClick);
  return () => window.removeEventListener("click", onRestartClick);
}, [gameOver]);


  function handleStart() {
  // --- reset game state
  dangersRef.current = [];
  shieldsRef.current = [];
  particlesRef.current = [];
  shardsRef.current = [];
  C.resetIds();
  spawnIntervalRef.current = C.SPAWN_INTERVAL_START;
  lastSpawnRef.current = performance.now();
  startTimeRef.current = performance.now();
  hitsRef.current = 0;
  setHits(0);
  scoreRef.current = 0;
  setScore(0);
  setGameOver(false);
  setIsStarted(true);


  const hv = assetsRef.current["hero_video"] as HTMLVideoElement | undefined;
if (hv) {
  hv.muted = true;
  hv.loop = true;
  hv.playsInline = true;
  hv.play().catch(() => {});
}

  heroStateRef.current.anim = "idle";

  const prev = envRef.current;
  if (prev) {
    const pv = assetsRef.current[`video_${prev}`] as HTMLVideoElement | null;
    if (pv) {
      try { pv.pause(); pv.currentTime = 0; } catch {/* ignore */}
    }
  }

  // choose env randomly
  const envs = C.ENVS || [];
  if (envs.length > 0) {
    const chosen = envs[Math.floor(Math.random() * envs.length)];
    envRef.current = chosen.key;

    const maybeV = assetsRef.current[`video_${chosen.key}`];
if (maybeV && maybeV instanceof HTMLVideoElement) {
  const v = maybeV;
  try {
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.currentTime = 0;
    requestAnimationFrame(() => v.play().catch(() => {}));
  } catch {/* ignore */}
}


    // clear any old weather and initialize new weather on next RAF tick
    weatherParticlesRef.current.length = 0;
    requestAnimationFrame(() => initWeatherForEnv(chosen.key));
  } else {
    envRef.current = null;
    weatherParticlesRef.current.length = 0;
  }
}


  return (
    <div style={{ width: "90%", maxHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {!loaded && (
        <div style={{ position: "absolute", top: 24, left: 24, padding: 8, background: "white", borderRadius: 8, pointerEvents: "none" }}>
          Loading assets...
        </div>
      )}

      {!isStarted && !gameOver && loaded && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto", zIndex: 40 }}>
          <div style={{ width: 280, maxWidth: "80%", padding: 22, borderRadius: 16, background: "linear-gradient(180deg,#fffef2,#fff1e6)", boxShadow: "0 18px 40px rgba(30,40,80,0.14)", textAlign: "center", border: "4px solid rgba(255,255,255,0.6)", transform: "translateY(-6px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg,#ffd166,#ff8fab)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 18px rgba(0,0,0,0.12)" }}>
                <div style={{ fontWeight: 900, fontSize: 26, color: "white" }}>⚔️</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>Sketch Shield</div>
                <div style={{ fontSize: 15, opacity: 0.9, marginTop: "5px" }}>Protect the hero</div>
              </div>
            </div>
            <br />
            <hr style={{ height: "0.3px", backgroundColor: "#44444465" }} />
            <h6 style={{ marginTop: 15, marginBottom: 8, fontSize: 14 }}>Survive as long as you can</h6>
            <p style={{ margin: 0, marginBottom: 12, fontSize: 12, color: "#333" }}>You have <strong>{C.HERO_MAX_HIT}</strong> hits. Timer is your score. Draw anchored lines that touch the ground to block falling dangers.</p>
            <button onClick={handleStart} style={{ marginTop: 12, padding: "12px 20px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(180deg,#5ee7df,#2b88ff)", color: "white", fontWeight: 900, fontSize: 16, boxShadow: "0 10px 18px rgba(43,136,255,0.28)" }}>
              Start Game
            </button>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#666" }}>Tip: Keep shields anchored to ground.</div>
              <div style={{ fontSize: 11, color: "#666" }}>Avoid drawing inside the hero zone.</div>
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto", zIndex: 50 }}>
          <div style={{ width: 240, maxWidth: "92%", padding: 20, borderRadius: 16, background: "linear-gradient(180deg,#ffefef,#fff5d6)", boxShadow: "0 20px 48px rgba(0,0,0,0.18)", textAlign: "center", border: "6px solid rgba(255,255,255,0.6)" }}>
            <div style={{ fontSize: 23, fontWeight: 900, color: "#ff4d6d" }}>Oh no — Hero Down!</div>
            <div style={{ marginTop: 14, fontSize: 18, fontWeight: 700 }}>You survived <span style={{ color: "#2b88ff" }}>{score}</span> seconds</div>
            <div style={{ marginTop: 14, fontSize: 12, color: "#444" }}>Nice try — click anywhere to return to the start menu and try again.</div>
            <div style={{ marginTop: 17, display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => {
                dangersRef.current = [];
                shieldsRef.current = [];
                particlesRef.current = [];
                shardsRef.current = [];
                C.SHIELD_ID = 1;
                C.DANGER_ID = 1;
                spawnIntervalRef.current = C.SPAWN_INTERVAL_START;
                lastSpawnRef.current = performance.now();
                startTimeRef.current = performance.now();
                hitsRef.current = 0;
                setHits(0);
                scoreRef.current = 0;
                setScore(0);
                setGameOver(false);
                setIsStarted(true);
              }} style={{ padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: "#4ad7a8", color: "white", fontWeight: 800 }}>
                Play Again
              </button>
              <button onClick={() => { setGameOver(false); setIsStarted(false); }} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer", background: "white", color: "#444", fontWeight: 800 }}>
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas
  ref={canvasRef}
  style={isMobile ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 0,
    boxShadow: 'none',
    cursor: 'crosshair',
    touchAction: 'none',
    zIndex: 10,
    display: 'block' // avoid inline whitespace gap
  } : {
    width: "100%",
    maxWidth: 1100,
    height: "min(82vh,760px)",
    borderRadius: 10,
    boxShadow: "0 24px 48px rgba(0,0,0,0.08)",
    cursor: "crosshair",
    touchAction: "none",
    zIndex: 1,
    display: 'block'
  }}
/>

      {isStarted && (
        <div style={{ position: "absolute", left: 18, top: 17, background: "rgba(255,255,255,0.96)", padding: 10, borderRadius: 10, pointerEvents: "none", boxShadow: "0 6px 18px rgba(0,0,0,0.06)", maxWidth: 360, zIndex: 1000 }}>
          <div style={{ marginTop: 8, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700 }}>Time: <span style={{ color: "#2b88ff" }}>{score}s</span></div>
            <div style={{ fontWeight: 700, marginLeft: '15px' }}>HP: <span style={{ color: "#ff4d6d" }}>{Math.max(0, C.HERO_MAX_HIT - hitsRef.current)}/{C.HERO_MAX_HIT}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
