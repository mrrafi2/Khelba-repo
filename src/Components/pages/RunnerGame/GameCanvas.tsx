
import React, { useEffect, useRef, useState } from "react";
import { CHAR_LIST, MAP_LIST } from "./config";
import type { CharacterKey, MapKey } from "./config";
import { loadImage, clamp, rndInt } from "./utils";
import { buildGroundTile } from "./groundTile";
import { drawHillsForMap } from "./hills";
import { drawTreesForMap, preloadTreeAssets,  } from "./trees";
import {useAuth} from "../../../context/AuthContext";

const GRAVITY = 1200;
const RUN_SPEED = 260;
const JUMP_V = -600;
const SPAWN_INTERVAL = 1200;
const MAX_OBSTACLES = 14;
const RUNNER_SCALE = 1.1;
const OBSTACLE_SCALE = 0.7;
const FULLSCREEN_CANVAS = true;

// --- Types used locally ---
type ImgMap = Record<string, HTMLImageElement | null>;
type Ob = { id: number; x: number; y: number; w: number; h: number; type: string; big: boolean; vx?: number };

// module-level caches (kept simple)
let treePositionsCache: { positions: { x: number; scale: number }[]; width: number; map: MapKey } | null = null;

type Props = {
  selectedChar: CharacterKey;
  selectedMap: MapKey;
  onExit?: () => void;
  onRoundEnd?: (data: { score: number; coins: number }) => void; // new
};

export default function GameCanvas({ selectedChar, selectedMap, onExit, onRoundEnd }: Props) 
 {
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const assetsRef = useRef<ImgMap>({});
  const [loaded, setLoaded] = useState(false);
  const [allAssetsLoaded, setAllAssetsLoaded] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const { addScore, addCoins } = useAuth();


  // health
  const [health, setHealth] = useState(100);
  const healthRef = useRef<number>(100);
  useEffect(() => {
    healthRef.current = health;
  }, [health]);

  useEffect(() => {
    if (isStarted) {
      healthRef.current = 100;
      setHealth(100);
    }
  }, [isStarted]);

  // hero
  const heroRef = useRef({
    x: 140,
    y: 0,
    vy: 0,
    onGround: true,
    w: 48,
    h: 64,
    animTime: 0,
    frame: 0,
    state: "idle" as "idle" | "walk" | "jump" | "hurt",
  });
  const heroImgs = useRef<{ w1?: HTMLImageElement; w2? : HTMLImageElement; walk3?: HTMLImageElement; jump?: HTMLImageElement; hurt?: HTMLImageElement; idle?: HTMLImageElement }>({});

  // SFX refs
  const sfxRef = useRef({
    run: null as HTMLAudioElement | null,
    jump: null as HTMLAudioElement | null,
    hit: null as HTMLAudioElement | null,
    coin: null as HTMLAudioElement | null,
    unlocked: false,
    runPlaying: false,
  });

  useEffect(() => {
    const run = new Audio("/assets/sfx/running.mp3");
    const jump = new Audio("/assets/sfx/jump.wav");
    const hit = new Audio("/assets/sfx/hit.wav");

    run.loop = true;
    run.volume = 0.55;
    jump.volume = 0.9;
    hit.volume = 1;

    run.preload = "auto";
    jump.preload = "auto";
    hit.preload = "auto";

    sfxRef.current.run = run;
    sfxRef.current.jump = jump;
    sfxRef.current.hit = hit;



function unlock() {
  if (sfxRef.current.unlocked) return;
  sfxRef.current.unlocked = true;
  musicUnlockedRef.current = true;

  try {
    const vv = videoRef.current;
    if (vv) {
      if (videoLoadedRef.current || vv.readyState >= 2) {
        vv.play().catch(() => {});
      } else {

        const onCan = () => vv.play().catch(()=>{});
        vv.addEventListener("canplaythrough", onCan, { once: true });

        try { vv.load(); } catch {}
      }
      
      
    }
  } catch (e) {}

  const p = run.play();
  if (p && typeof (p as any).then === "function") {
    p.then(() => {
      run.pause();
      run.currentTime = 0;
    }).catch(() => {});
  }

  if (isStarted && !gameOver) {
    startMusicForMap(selectedMap);
  }

  try {
  const coinSfx = new Audio("/assets/sfx/coin.wav");
  coinSfx.preload = "auto";
  coinSfx.volume = 0.7;
  coinSfx.loop = false;
  sfxRef.current.coin = coinSfx; 
} catch (e) { /* ignore */ }

  try {
  const bgv = bgVideoRef.current;
  if (bgv && bgVideoReadyRef.current) {
    bgv.play().catch(()=>{ /* ignore */ });
  }
} catch (e) { /* ignore */ }

  window.removeEventListener("pointerdown", unlock);
  window.removeEventListener("touchstart", unlock);
  window.removeEventListener("click", unlock);
}
 
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    window.addEventListener("click", unlock, { once: true });

    return () => {
      run.pause();
      jump.pause();
      hit.pause();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("click", unlock);
    };
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoLoadedRef = useRef(false);
const videoPlayingRef = useRef(false);
const videoPlayRequestedRef = useRef(false);
const videoHandlersRef = useRef<{ onCanPlay?: () => void; onPlaying?: () => void; onPause?: () => void; onError?: (e:any)=>void }>({});


  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgOffsetRef = useRef<number>(0);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicIndexRef = useRef<number>(0);
  const musicUnlockedRef = useRef(false);

  const musicPlaylist = useRef<Record<MapKey, string[]>>({
    default: ["/assets/sfx/meadow-1.m4a", "/assets/sfx/meadow-2.wav"],
    arctic: ["/assets/sfx/arctic-1.wav", "/assets/sfx/arctic-2.wav", "/assets/sfx/arctic-3.wav"],
    desert: ["/assets/sfx/desert-1.wav", "/assets/sfx/desert-2.wav"],
    bangu: [
      "/assets/sfx/bangu-1.mp3",
      "/assets/sfx/bangu-2.mp3",
      "/assets/sfx/bangu-3.mp3",
      "/assets/sfx/bangu-4.mp3",
      "/assets/sfx/bangu-5.mp3",
      "/assets/sfx/bangu-6.mp3",
      "/assets/sfx/bangu-7.mp3",
      "/assets/sfx/bangu-9.mp3",
      "/assets/sfx/bangu-10.mp3",
      "/assets/sfx/bangu-11.mp3",
      "/assets/sfx/bangu-12.mp3",
      "/assets/sfx/bangu-13.mp3",
    ],
    haunted: ["/assets/sfx/haunted-1.wav", "/assets/sfx/haunted-2.wav", "/assets/sfx/haunted-3.wav", "/assets/sfx/haunted-4.wav", "/assets/sfx/haunted-5.wav", "/assets/sfx/haunted-6.mp3"],

     forest: ["/assets/sfx/forest-1.wav", "/assets/sfx/forest-2.wav", "/assets/sfx/forest-3.wav", "/assets/sfx/forest-4.wav"],

  beach: ["/assets/sfx/beach-1.wav", "/assets/sfx/beach-2.wav"],
  });

  const musicVolumeByMap = useRef<Record<MapKey, number>>({
    default: 0.65,
    arctic: 0.75,
    desert: 0.60,
    bangu: 0.65,
    haunted: 0.78,
    forest: 0.7,
    beach: 0.7,
  });

    const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoReadyRef = useRef<boolean>(false);
  const bgPosterImgRef = useRef<HTMLImageElement | null>(null);
  const lastBgPlayAttemptRef = useRef<number>(0);

useEffect(() => {
  const info = MAP_LIST.find((m) => m.key === selectedMap);
  // cleanup previous video (if any)
  if (bgVideoRef.current) {
    try { bgVideoRef.current.pause(); } catch { /* ignore */ }
    try { bgVideoRef.current.src = ""; } catch { /* ignore */ }
    try { bgVideoRef.current.removeAttribute("src"); } catch { /* ignore */ }
try {
  bgVideoRef.current?.load?.();
} catch { /* ignore */ }
    bgVideoRef.current = null;
    bgVideoReadyRef.current = false;
  }

  // clear previous poster
  bgPosterImgRef.current = null;

  if (!info) return;

  // load poster image (fallback while video isn't ready)
  if (info.bgPoster) {
    const img = new Image();
    img.src = info.bgPoster;
    img.onload = () => {
      bgPosterImgRef.current = img;
    };
     img.crossOrigin = "anonymous";
  }

  if (info.bgVideo) {
    const video = document.createElement("video");
    video.muted = true; 
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.src = info.bgVideo;


    // helper: best-effort play 
    const tryPlay = () => {
      try {
        const p = video.play();
        if (p && typeof (p as any).then === "function") {
          p.catch(() => {
          });
        }
      } catch (e) {
        //
      }
    };

    const onCanPlay = () => {
      bgVideoReadyRef.current = true;
      tryPlay();
    };

    const onEnded = () => {
      bgVideoReadyRef.current = true;
      tryPlay();
    };

    const onError = (e: any) => {
      console.warn("bg video load/play error:", info.bgVideo, e);
      bgVideoReadyRef.current = false;
    };

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("canplaythrough", onCanPlay);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    // start loading and attempt initial play
    try {
      video.load();
    } catch { /* ignore */ }
    tryPlay();

    bgVideoRef.current = video;

    // cleanup handler for this effect
    return () => {
      try {
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("canplaythrough", onCanPlay);
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("error", onError);
      } 
      catch { /* ignore */ }
      try { video.pause(); } catch { /* ignore */ }

      try { video.src = ""; } catch { /* ignore */ }

      bgVideoRef.current = null;
      bgVideoReadyRef.current = false;
    };
  }

  return () => {
  };
}, [selectedMap]);


  const hillsCanvasRef = useRef<HTMLCanvasElement | null>(null);
const treesCanvasRef = useRef<HTMLCanvasElement | null>(null);
const parallaxMetaRef = useRef<{ map?: MapKey; width?: number; height?: number }>({});


  // obstacles
  const obstaclesRef = useRef<Ob[]>([]);
  const OB_ID = useRef(1);

  // particles, weather, timers
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);

  type WeatherType = "sand" | "snow" | "rain";
  type WeatherParticle = { x: number; y: number; vx: number; vy: number; size: number; life?: number; alpha?: number; kind?: number };

  const weatherRef = useRef<{
    active: boolean;
    type: WeatherType | null;
    endTime: number;
    nextCheck: number;
    intensity: number;
    particles: WeatherParticle[];
    lastEmit: number;
  }>({
    active: false,
    type: null,
    endTime: 0,
    nextCheck: 0,
    intensity: 0.6,
    particles: [],
    lastEmit: 0,
  });

  const lastSpawnRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const scoreRef = useRef(0);


  // coin refs / state 
const coinsRef = useRef<
  { id: number; x: number; y: number; w: number; h: number; vx: number; collected?: boolean; animTime?: number }[]
>([]);
const COIN_ID = useRef(1);
const [coinCount, setCoinCount] = useState(0);

const coinCountRef = useRef<number>(0);
const roundSavedRef = useRef<boolean>(false);

  // speed ramp parameters
  const SPEED_MIN_MULT = 0.7;
  const SPEED_MAX_MULT = 2;
  const SPEED_RAMP_DURATION = 60;
  const currentSpeedRef = useRef(RUN_SPEED * SPEED_MIN_MULT);

  function rebuildParallaxLayers(viewW: number, viewH: number, groundTop: number, map: MapKey) {
  const stripW = Math.max(Math.ceil(viewW), 512) * 2; 
  const stripH = viewH;

  const meta = parallaxMetaRef.current;
  if (meta.map === map && meta.width === stripW && meta.height === stripH) return;


  // -- BG strip 
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

    // tile full-image copies across the strip
    for (let x = 0; x < stripW; x += drawW) {
      try {
        bgCtx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, x, 0, drawW, drawH);

      } 
      catch (e) {
        bgCtx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, 0, 0, stripW, stripH);
        break;
      }
    }
  } else {
    // fallback gradient
    const sky = bgCtx.createLinearGradient(0, 0, 0, stripH);
    sky.addColorStop(0, "#dff3ff");
    sky.addColorStop(0.6, "#bfe9ff");
    sky.addColorStop(1, "#8fcfff");
    bgCtx.fillStyle = sky;
    bgCtx.fillRect(0, 0, stripW, stripH);
  }
}
bgCanvasRef.current = bgC;


  // -- Hills strip --
  const hc = document.createElement("canvas");
  hc.width = stripW;
  hc.height = stripH;
  const hctx = hc.getContext("2d");
  if (hctx) {
    hctx.clearRect(0, 0, stripW, stripH);
    try {
      drawHillsForMap(hctx, map, stripW, stripH);
    } catch (e) {
      // silent
    }
  }


  // -- Trees strip --
  const tc = document.createElement("canvas");
  tc.width = stripW;
  tc.height = stripH;
  const tctx = tc.getContext("2d");
  if (tctx) {
    tctx.clearRect(0, 0, stripW, stripH);

    try {
      const treesArr = buildTreeCache(stripW, map);
      drawTreesForMap(tctx, map, treesArr, groundTop);
    } catch (e) {
      // silent
    }
  }

  bgCanvasRef.current = bgC;
  hillsCanvasRef.current = hc;
  treesCanvasRef.current = tc;
  parallaxMetaRef.current = { map, width: stripW, height: stripH };
}


  // small helper: roundRect used in some local placeholder drawing too
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

  // map-specific obstacle pool helper
  function mapObstaclePool(map: MapKey) {
    if (map === "desert") return ["cactus", "snail_shell", "worm_ring_move_a", "slime_fire_flat", "slime_fire_walk_a", "rock", "block_planks", "bricks_brown"];

    if (map === "arctic") return ["snow", "slime_normal_flat", "snail_shell", "worm_normal_move_a", "spring", "spikes", "bricks_grey"];

    if (map === "haunted") return ["barnacle_attack_a", "barnacle_attack_b", "fly_a", "fly_b", "slime_spike_flat", "spikes", "mouse_walk_a", "mouse_walk_b", "saw_b", "grass_purple", "ladybug_fly"];

    if (map === "bangu") {
      return [
        "asad_kamal.png",
        "barri sumon.png",
        "dorbesh.png",
        "hasao mahmud.png",
        "hasina.png",
        "joy.png",
        "kauua kader.png",
        "momen.png",
        "momtag biddut.png",
        "murgi kobir.png",
        "palak.png",
        "s osman.png",
        "sheik_selim.png",
      ];
    }
    return ["block_planks", "block_plank", "rock", "fence_broken", "frog_idle", "frog_jump", "ladybug_walk_a", "ladybug_walk_b", "bee_a", "bee_b"];
  }

  useEffect(() => {
  let alive = true;
  preloadTreeAssets().catch(() => { /* ignore load failures, fallback will handle missing images */ });
  return () => { alive = false; };
}, []); 


  // load essential assets
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoaded(false);
      setAllAssetsLoaded(false);

      const mapBg = MAP_LIST.find((m) => m.key === selectedMap)?.bg || "";
      const m: ImgMap = {};

      const char = CHAR_LIST.find((c) => c.key === selectedChar)!;
      const poses = char.poses;

      try {
        m["char_w1"] = await loadImage(poses.walk1).catch(() => null);
        m["char_w2"] = await loadImage(poses.walk2).catch(() => null);

        if (poses.walk3) m["char_walk3"] = await loadImage(poses.walk3).catch(() => null);

        if (poses.jump) m["char_jump"] = await loadImage(poses.jump).catch(() => null);
        if (poses.hurt) m["char_hurt"] = await loadImage(poses.hurt).catch(() => null);
        if (poses.idle) m["char_idle"] = await loadImage(poses.idle).catch(() => null);
      m["coin"] = await loadImage("/assets/Tiles/Default/star.png").catch(() => null);


    if (poses.video) {
  try {
    const v = document.createElement("video");
    v.src = poses.video; 
    v.loop = true;
    v.muted = true;          
    v.playsInline = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous"; 

    // reset refs/state
    videoLoadedRef.current = false;
    videoPlayingRef.current = false;
    videoPlayRequestedRef.current = false;
    videoRef.current = v;

    // event listeners
    const onCanPlay = () => {
      videoLoadedRef.current = true;
      if (musicUnlockedRef.current || sfxRef.current.unlocked) {
        v.play().catch(()=>{ /* ignore */ });
      }
    };

    const onPlaying = () => { videoPlayingRef.current = true; };
    const onPause = () => { videoPlayingRef.current = false; };
    const onError = (e: any) => {
      console.warn("Character video failed to load/play:", poses.video, e);
      videoLoadedRef.current = false;
      videoPlayingRef.current = false;
    };

    v.addEventListener("canplaythrough", onCanPlay, { once: true });
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onPause);
    v.addEventListener("error", onError);

    try { v.load(); } catch (e) { /* ignore */ }

    
    videoRef.current = v;
  } catch (e) {
    console.warn("Failed to create video element for character:", e);
    videoRef.current = null;
  }
}



        m["bg"] = await loadImage(mapBg).catch(() => null);
      } catch (e) {
        console.warn("Essential load error", e);
      }

      if (cancelled) return;
      assetsRef.current = { ...assetsRef.current, ...m };
      heroImgs.current.w1 = m["char_w1"] || heroImgs.current.w1;
      heroImgs.current.w2 = m["char_w2"] || heroImgs.current.w2;
      heroImgs.current.walk3 = m["char_walk3"] || heroImgs.current.walk3; 
      heroImgs.current.jump = m["char_jump"] || heroImgs.current.jump;
      heroImgs.current.hurt = m["char_hurt"] || heroImgs.current.hurt;
      heroImgs.current.idle = m["char_idle"] || heroImgs.current.idle;
      setLoaded(true);

      (async () => {
        const obstacleFiles = [
          "slime_fire_flat","slime_fire_walk_a","slime_fire_walk_b",
          "slime_normal_flat","slime_normal_walk_a","slime_normal_walk_b",
          "slime_spike_flat","snail_shell","snail_walk_a","snail_walk_b",
          "worm_normal_move_a","worm_normal_move_b","worm_ring_move_a","worm_ring_move_b",
          "sign","snow","spikes","spring_out","spring","torch_on_b",
          "bricks_brown","bricks_grey","bridge_logs","bridge","bush","cactus",
          "block_plank","block_planks","block_red","block_spikes",
          "barnacle_attack_a","barnacle_attack_b","bee_a","bee_b","fly_a","fly_b",
          "frog_idle","frog_jump","ladybug_fly","ladybug_walk_a","ladybug_walk_b",
          "mouse_walk_a","mouse_walk_b","saw_b","grass_purple","grass","fireball","rock","fence_broken"
        ];

        const banguAssets = [
          "asad_kamal.png",
          "barri sumon.png",
          "dorbesh.png",
          "hasao mahmud.png",
          "hasina.png",
          "joy.png",
          "kauua kader.png",
          "momen.png",
          "momtag biddut.png",
          "murgi kobir.png",
          "palak.png",
          "s osman.png",
          "sheik_selim.png",
        ];

        const loads: Promise<void>[] = [];

        for (const f of obstacleFiles) {
          const isEnemy = !!f.match(/slime|snail|worm|barnacle|bee|ladybug|fly|frog|mouse/);

          const folder = isEnemy ? "enemies/Enemies/Default" : "Tiles/Default";

          const path = `/assets/${folder}/${f}.png`;
          loads.push(
            loadImage(encodeURI(path))
              .then((img) => { if (!cancelled) assetsRef.current[f] = img; })
              .catch(() => { if (!cancelled) assetsRef.current[f] = null; })
          );
        }

        for (const b of banguAssets) {

          const p = `/assets/bal/${b}`;
          loads.push(
            loadImage(encodeURI(p))
              .then((img) => { if (!cancelled) assetsRef.current[b] = img; })
              .catch(() => { if (!cancelled) assetsRef.current[b] = null; })
          );
        }

        await Promise.allSettled(loads);
        if (!cancelled) setAllAssetsLoaded(true);
      })();
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedChar, selectedMap]);

  // sizing
  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const vw = FULLSCREEN_CANVAS ? window.innerWidth : Math.min(window.innerWidth - 10, 1200);
      const vhPx = Math.floor(window.innerHeight * 0.95);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vhPx}px`;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vhPx * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // clear caches that depend on dimension or map (we'll rebuild)
      treePositionsCache = null;
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [loaded]);


  useEffect(() => {
  // runs when selectedChar or selectedMap changes
  let cancelled = false;

  const cleanupOldVideo = () => {
    const oldV = videoRef.current;
    if (oldV) {
      try {
        if (videoHandlersRef.current.onCanPlay) oldV.removeEventListener("canplaythrough", videoHandlersRef.current.onCanPlay);
        if (videoHandlersRef.current.onPlaying) oldV.removeEventListener("playing", videoHandlersRef.current.onPlaying);
        if (videoHandlersRef.current.onPause) oldV.removeEventListener("pause", videoHandlersRef.current.onPause);
        if (videoHandlersRef.current.onError) oldV.removeEventListener("error", videoHandlersRef.current.onError);
      } catch (e) { /* ignore */ }

      try {
  oldV.pause();
} catch { /* ignore */ }

try {
  oldV.src = "";
  oldV.removeAttribute("src");

  oldV?.load?.();
} catch { /* ignore */}
    }

    videoRef.current = null;
    videoLoadedRef.current = false;
    videoPlayingRef.current = false;
    videoPlayRequestedRef.current = false;
    videoHandlersRef.current = {};
  };

  // cleanup before creating a new one
  cleanupOldVideo();

  const char = CHAR_LIST.find(c => c.key === selectedChar)!;
  const poses = char?.poses ?? {};

  if (poses.video) {
    try {
      const v = document.createElement("video");
      v.src = poses.video;
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      v.crossOrigin = "anonymous";

      videoLoadedRef.current = false;
      videoPlayingRef.current = false;
      videoPlayRequestedRef.current = false;

      const onCanPlay = () => {
        videoLoadedRef.current = true;
        if (videoPlayRequestedRef.current) v.play().catch(()=>{});
      };
      const onPlaying = () => { videoPlayingRef.current = true; };
      const onPause = () => { videoPlayingRef.current = false; };
      const onError = (e: any) => {
        console.warn("Character video error:", poses.video, e);
        videoLoadedRef.current = false; videoPlayingRef.current = false;
      };

      videoHandlersRef.current.onCanPlay = onCanPlay;
      videoHandlersRef.current.onPlaying = onPlaying;
      videoHandlersRef.current.onPause = onPause;
      videoHandlersRef.current.onError = onError;

      v.addEventListener("canplaythrough", onCanPlay);
      v.addEventListener("playing", onPlaying);
      v.addEventListener("pause", onPause);
      v.addEventListener("error", onError);

      try { v.load(); } catch { /* ignore */ }

      videoRef.current = v;
    } catch (e) {
      console.warn("Failed to create video element for character:", e);
      videoRef.current = null;
    }
  }

  return () => {
    // effect cleanup: remove listeners and release video
    cleanupOldVideo();
    cancelled = true;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedChar, selectedMap]);



  // MUSIC CONTROLS 
  function stopMusic() {

    try {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.onended = null;
        musicRef.current.src = ""; 
        musicRef.current = null;
      }
    } catch (e) { /* ignore */ }
  }

  
  function playNextTrackForMap(map: MapKey) {
    const list = musicPlaylist.current[map] || [];
    if (!list.length) return;

    // pick index (wrap)
    const idx = musicIndexRef.current % list.length;
    const path = list[idx];

    // cleanup existing
    stopMusic();

    const a = new Audio(path);
    a.preload = "auto";
    a.volume = (musicVolumeByMap.current[map] ?? 0.5);
    a.loop = list.length === 1;
    a.onended = () => {
      if (list.length > 1) {
        musicIndexRef.current = (musicIndexRef.current + 1) % list.length;
        window.setTimeout(() => playNextTrackForMap(map), 120);
      }
    };

    const p = a.play();
    if (p && typeof (p as any).catch === "function") {
      p.catch(() => {
       
      });
    }

    musicRef.current = a;
  }


  function startMusicForMap (map: MapKey, startRandom = true) {

    const list = musicPlaylist.current[map] || [];
    if (!list.length) {
      stopMusic();
      return;
    }
    // choose starting index
    musicIndexRef.current = startRandom ? Math.floor(Math.random() * list.length) : 0;
    playNextTrackForMap(map);
  }

  // Pause (not destroy) 
  function pauseMusic() {
    try {
      if (musicRef.current && !musicRef.current.paused) {
        musicRef.current.pause();
      }
    } catch (e) { /* ignore */ }
  }

  // Resume music if element exists (resume same track)
  function resumeMusic() {
    try {
      if (musicRef.current && musicRef.current.paused) {
        musicRef.current.play().catch(() => {});
      }
    } catch (e) { /* ignore */ }
  }


    // manage music on map change / start / gameOver
  useEffect(() => {
    if (!musicUnlockedRef.current) {
      stopMusic();
      return;
    }

    if (!isStarted || gameOver) {
      pauseMusic();
      return;
    }

    startMusicForMap(selectedMap, true);

    return () => {
      
      stopMusic();
    };
  }, [selectedMap, isStarted, gameOver]);


  useEffect(() => {
  return () => { stopMusic(); };
}, []);

function drawBackground(ctx: CanvasRenderingContext2D, vw: number, vh: number) {
  const info = MAP_LIST.find(m => m.key === selectedMap);
  if (!info) {
    // ultimate fallback
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, vw, vh);
    return;
  }

  const mapVideo = bgVideoRef.current;
  const poster = bgPosterImgRef.current;

  // if video element exists and appears ready, draw it as cover
  if (mapVideo && bgVideoReadyRef.current && mapVideo.readyState >= 2) {
    try {
      // preserve aspect by cover-scaling the video to canvas
      const pw = mapVideo.videoWidth || vw;
      const ph = mapVideo.videoHeight || vh;
      const scale = Math.max(vw / pw, vh / ph);
      const sw = Math.floor(vw / scale);
      const sh = Math.floor(vh / scale);
      const sx = Math.floor(((pw) - sw) / 2);
      const sy = Math.floor(((ph) - sh) / 2);
      ctx.drawImage(mapVideo, sx, sy, sw, sh, 0, 0, vw, vh);

      // If the video is paused but should be playing, try to resume (best-effort)
      if (mapVideo.paused && (musicUnlockedRef.current || sfxRef.current.unlocked)) {
        mapVideo.play().catch(() => {});
      }
      return;
    } catch (err) {
      console.warn("bg video drawImage failed:", err);
      // fall through to poster/image
    }
  }

  // 2) poster fallback (cover)
  if (poster && poster.complete) {
    const pw = poster.width;
    const ph = poster.height;
    const scale = Math.max(vw / pw, vh / ph);
    const sx = (pw * scale - vw) * 0.5;
    const sy = (ph * scale - vh) * 0.5;
    ctx.drawImage(poster, sx / scale, sy / scale, vw / scale, vh / scale, 0, 0, vw, vh);
    return;
  }

  // 3) prebuilt bg strip (if available)
  if (bgCanvasRef.current) {
    const bgStrip = bgCanvasRef.current;
    for (let x = 0; x < vw + bgStrip.width; x += bgStrip.width) {
      ctx.drawImage(bgStrip, x, 0, bgStrip.width, bgStrip.height);
    }
    return;
  }

  // 4) static image fallback (assetsRef["bg"])
  const bgImg = assetsRef.current["bg"];
  if (bgImg && bgImg.width && bgImg.height) {
    try {
      const imgW = bgImg.width;
      const imgH = bgImg.height;
      const scale = Math.max(vw / imgW, vh / imgH);
      const sw = Math.floor(vw / scale);
      const sh = Math.floor(vh / scale);
      const sx = Math.max(0, Math.floor((imgW - sw) / 2));
      const sy = Math.max(0, Math.floor((imgH - sh) / 2));
      ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, vw, vh);
      return;
    } catch (e) {
      // fall through to gradient
    }
  }

  // 5) final fallback gradient
  const sky = ctx.createLinearGradient(0, 0, 0, vh);
  sky.addColorStop(0, "#dff3ff");
  sky.addColorStop(0.6, "#bfe9ff");
  sky.addColorStop(1, "#8fcfff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, vw, vh);
}

useEffect(() => {
  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    bgOffsetRef.current = 0;
  };
}, []);



  // small weather control helpers
  function startWeather (now: number, type: WeatherType, durationMs: number, intensity = 0.6 ) {

    const w = weatherRef.current;
    w.active = true;
    w.type = type;
    w.endTime = now + durationMs;
    w.intensity = Math.max(0.15, Math.min(1, intensity));
    w.particles = [];
    w.lastEmit = 0;
    w.nextCheck = w.endTime + rndInt(6000, 15000);
  }

  function stopWeather() {
    const w = weatherRef.current;
    w.active = false;
    w.type = null;
    w.particles.length = 0;
    w.endTime = 0;
    w.lastEmit = 0;
    w.nextCheck = performance.now() + rndInt(6000, 14000);
  }

  useEffect(() => {
    weatherRef.current.active = false;
    weatherRef.current.type = null;
    weatherRef.current.particles = [];
    weatherRef.current.nextCheck = performance.now() + rndInt(800, 2400);
    stopWeather();
  }, [selectedMap]);

  // input
  useEffect(() => {

    function onKey(e: KeyboardEvent) {

      if (e.code === "Space") doJump();
       if (e.code === "Escape") {
       onExit?.();
      }
    }


    function onClick () { doJump(); }

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [isStarted, gameOver, onExit]);

  function doJump() {
    if (!isStarted || gameOver) return;
    const h = heroRef.current;
    if (h.onGround) {
      h.vy = JUMP_V;
      h.onGround = false;
      h.state = "jump";
      h.animTime = 0;
      try {
        const js = sfxRef.current.jump;
        if (js) {
          js.currentTime = 0;
          js.play().catch(() => {});
        }
      } catch { /* ignore */}
    }
  }

  function spawnParticles(cx: number, cy: number, n = 8) {

    for (let i = 0; i < n; i++) {
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 24,
        y: cy + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 240,
        life: 0.6 + Math.random() * 0.8,
      });
    }
  }

  function buildTreeCache(viewW: number, map: MapKey) {

      if (treePositionsCache && treePositionsCache.width === Math.ceil(viewW) && treePositionsCache.map === map) return treePositionsCache.positions;
      const arr: { x: number; scale: number }[] = [];

      
      const isBangu = map === "bangu";
      const count = isBangu ? Math.max(6, Math.round(viewW / 220)) : Math.max(6, Math.round(viewW / 240));
      for (let i = 0; i < count; i++) {

        const x = Math.round((i / count) * viewW + rndInt(-80, 80));
        const scale = isBangu ? (0.8 + Math.random() * 0.6) : (0.6 + Math.random() * 1.0);
        arr.push({ x, scale });
      }
      treePositionsCache = { positions: arr, width: Math.ceil(viewW), map };
      return arr;
    }


  // main loop

  useEffect(() => {

    if (!loaded || !isStarted) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = "high";

    let last = performance.now();
    startTimeRef.current = last;
    lastSpawnRef.current = last;
    scoreRef.current = 0;


   function spawnObstacle(viewW: number, viewH: number, groundTop: number, grassBand: number) { 
  if (obstaclesRef.current.length >= MAX_OBSTACLES) return;

  // base spawn X (off-screen)
  const baseX = viewW + rndInt(160, 280);

  // per-map pixel gap ranges (min, max) - tune these for each map
  const gapRanges: Record<MapKey, [number, number]> = {
    default: [320, 780],
    desert:  [300, 700],
    arctic:  [340, 820],
    bangu:   [300, 640],
    haunted: [360, 820],
    forest: [350, 780], 
    beach: [310, 720],
  };
  const [gapMinDefault, gapMaxDefault] = gapRanges[selectedMap] ?? gapRanges.default;

  // time since start (seconds) for oscillation
  const start = startTimeRef.current ?? performance.now();
  const t = (performance.now() - start) / 1000;

  const freqByMap: Record<MapKey, number> = {
    default: 0.10, 
    desert:  0.12,
    arctic:  0.08,
    bangu:   0.14,
    haunted: 0.10,
    forest:  0.11,
    beach:   0.13
  };
  const ampByMap: Record<MapKey, number> = {
    default: 0.36, 
    desert:  0.30,
    arctic:  0.42,
    bangu:   0.28,
    haunted: 0.44,
    forest:  0.34,
    beach:   0.38
  };

  const freq = freqByMap[selectedMap] ?? 0.12;
  const amp = ampByMap[selectedMap] ?? 0.36;

  const phase = (selectedMap.charCodeAt(0) % 97) + 0.7; 
  const osc = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI * freq) + phase);

  const range = gapMaxDefault - gapMinDefault;

  const modCenter = 0.5; // center of lerp
  const modFactor = modCenter + (osc - 0.5) * amp; 
  const modClamped = Math.max(0, Math.min(1, modFactor));
  const dynamicGapBase = Math.round(gapMinDefault + range * modClamped);

  const jitter = rndInt(-Math.round(range * 0.08), Math.round(range * 0.08));

  const speedRatio = currentSpeedRef.current / RUN_SPEED;
  const speedScale = Math.max(0.8, Math.min(1.6, speedRatio)); 

  // Combine all into final minGap
  let minGap = Math.max(120, Math.round(dynamicGapBase * speedScale + jitter));

  // Small safety clamp so minGap never becomes negative or too small
  const ABSOLUTE_MIN_GAP = 120;
  minGap = Math.max(ABSOLUTE_MIN_GAP, minGap);

  const pool = mapObstaclePool(selectedMap);
  const tKey = pool[Math.floor(Math.random() * pool.length)];
  const big = Math.random() < 0.28;

  const baseW = big ? rndInt(56, 92) : rndInt(30, 46);
  const baseH = big ? rndInt(48, 80) : rndInt(28, 44);
  const w = Math.max(16, Math.floor(baseW * OBSTACLE_SCALE));
  const h = Math.max(16, Math.floor(baseH * OBSTACLE_SCALE));

  const last = obstaclesRef.current.length ? obstaclesRef.current[obstaclesRef.current.length - 1] : null;
  let spawnX = baseX;
  if (last) {
    spawnX = Math.max(spawnX, last.x + last.w + minGap);
  }

  // spawn coordinate and push
  const y = groundTop + grassBand - h;
  const ob: Ob = { id: OB_ID.current++, x: spawnX, y, w, h, type: tKey, big, vx: -Math.round(currentSpeedRef.current) };
  obstaclesRef.current.push(ob);

(function spawnCoinsInGap(prevOb, newOb) {

  if (!prevOb) return;

  const gapStart = prevOb.x + prevOb.w + 5;
  const gapEnd = newOb.x - 5;
  const gapWidth = gapEnd - gapStart;
  if (gapWidth < 100) return; 

  const maxCoins = Math.min(3, Math.floor(gapWidth / 100));
  const count = Math.max(1, Math.floor(Math.random() * (maxCoins + 1)));

  const coinY = groundTop + grassBand - newOb.h - 27; 

  for (let i = 0; i < count; i++) {
    const px = Math.round(gapStart + (i + 0.5) * (gapWidth / count) + (Math.random() - 0.5) * 25);
    const coinW = 32; 
    const coinH = 32;
    coinsRef.current.push({
      id: COIN_ID.current++,
      x: px,
      y: coinY,
      w: coinW,
      h: coinH,
      vx: -Math.round(currentSpeedRef.current), // move with world speed
      collected: false,
      animTime: 0,
    });
  }
})(last , ob );

}


    function maybeToggleWeather(now: number) {

      const w = weatherRef.current;
      if (w.active && now >= w.endTime) {
        stopWeather();
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
          startWeather(now, type!, dur, intensity);
        } else {
          w.nextCheck = now + rndInt(4000, 12000);
        }
      }
    }

    function emitWeather(now: number, vw: number, vh: number, groundTop: number) {

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

    function updateWeather (now: number, ctx: CanvasRenderingContext2D, vw: number, vh: number, groundTop: number) 
    {
      maybeToggleWeather(now);
      const w = weatherRef.current;
      if (!w.active || !w.type) return;
      emitWeather(now, vw, vh, groundTop);

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


    function thinTrees(trees: { x: number; scale: number }[], 
      minDistance: number) {

  if (trees.length <= 1) return trees;
  const result: typeof trees = [trees[0]];

  for (let i = 1; i < trees.length; i++) {
    const last = result[result.length - 1];

    if (trees[i].x - last.x >= minDistance) {
      result.push(trees[i]);
    }
  }
  return result;
}

// main step function

    function step(now: number) {

  // frame timing
  const dt = Math.min(40, now - last) / 1000;
  last = now;

  // score/time
  if (startTimeRef.current != null) {
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    if (elapsed !== scoreRef.current) {
      scoreRef.current = elapsed;
      setScore(elapsed);
    }
  }

  // layout / viewport
  const rect = canvasRef.current!.getBoundingClientRect();
  const vw = rect.width;
  const vh = rect.height;
  const groundHeight = clamp(vh * 0.20, 72, 220);
  const groundTop = Math.floor(vh - groundHeight);
  const grassBand = Math.floor(clamp(28, 18, 48));

  // parallax factors (declare early)
  const groundScrollFactor = 0.4;
  const bgFactor = 0.1;
  const hillsFactor = 0.10;
  const treesFactor = 0.13;

  rebuildParallaxLayers(vw, vh, groundTop, selectedMap);

  // spawn obstacles (timed)
  if (now - lastSpawnRef.current > SPAWN_INTERVAL) {
    spawnObstacle(vw, vh, groundTop, grassBand);
    lastSpawnRef.current = now - Math.random() * 300;
  }

  // speed ramp
  const elapsedSinceStart = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
  const initialSpeed = RUN_SPEED * SPEED_MIN_MULT;
  const maxSpeed = RUN_SPEED * SPEED_MAX_MULT;
  const tProgress = Math.min(1, elapsedSinceStart / SPEED_RAMP_DURATION);
  const currentSpeed = initialSpeed + (maxSpeed - initialSpeed) * tProgress;
  currentSpeedRef.current = currentSpeed;

  // hero physics & sizing
  const h = heroRef.current;
  h.animTime += dt;
  h.vy += GRAVITY * dt;
  const drawSizeBase = Math.min(96, Math.max(40, Math.floor(vw / 8)));
  const drawSize = Math.max(24, Math.floor(drawSizeBase * RUNNER_SCALE));
  h.w = Math.floor(drawSize * 0.75);
  h.h = drawSize;
  h.y += h.vy * dt;
  const heroBase = groundTop + grassBand - h.h;
  if (h.y >= heroBase) {
    h.y = heroBase;
    h.vy = 0;
    if (!h.onGround) h.onGround = true;
  } else {
    h.onGround = false;
  }

  // animation state
  if (h.state === "hurt") {
    if (h.animTime > 0.5) {
      h.state = h.onGround ? "walk" : "jump";
      h.animTime = 0;
    }
  } else if (!h.onGround) {
    h.state = "jump";
  } else {
    h.state = "walk";
    if (h.animTime > 0.10) {
      const maxFrames = heroImgs.current.walk3 ? 3 : 2;
      h.frame = (h.frame + 1) % maxFrames;
      h.animTime = 0;
    }
  }

  // run SFX loop control
  try {
    const run = sfxRef.current?.run;
    if (run) {
      const shouldPlay = h.state === "walk" && h.onGround && isStarted && !gameOver;
      if (shouldPlay && !sfxRef.current.runPlaying) {
        run.play().catch(() => {});
        sfxRef.current.runPlaying = true;
      } else if (!shouldPlay && sfxRef.current.runPlaying) {
        run.pause();
        try { run.currentTime = 0; } catch { /* ignore */ }
        sfxRef.current.runPlaying = false;
      }
    }
  } catch { /* ignore */ }


  // move obstacles & collisions

for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
  const ob = obstaclesRef.current[i];

  ob.vx = -currentSpeedRef.current;
  ob.x += (ob.vx ?? -RUN_SPEED) * dt;
  ob.y = groundTop + grassBand - ob.h;

  // collision detection 
  const hx = h.x + h.w / 2;
  const hy = h.y + h.h / 2;
  const obx = ob.x + ob.w / 2;
  const oby = ob.y + ob.h / 2;
  const collided =
    Math.abs(hx - obx) < (h.w / 2 + ob.w / 2 - 6) &&
    Math.abs(hy - oby) < (h.h / 2 + ob.h / 2 - 6);

  if (collided) {
    try {
      const hs = sfxRef.current?.hit;
      if (hs) {
        hs.currentTime = 0;
        hs.play().catch(() => {});
      }
      const run = sfxRef.current?.run;
      if (run && sfxRef.current.runPlaying) {
        run.pause();
        try { run.currentTime = 0; } catch { /* ignore */ } 
        sfxRef.current.runPlaying = false;
      }
    } catch { /* ignore */ }

    setHealth((prev) => {
      const nv = Math.max(0, prev - (ob.big ? 34 : 20));
      healthRef.current = nv;
      return nv;
    });

    spawnParticles(ob.x + ob.w / 2, ob.y + ob.h / 2, ob.big ? 24 : 12);
    obstaclesRef.current.splice(i, 1);

    h.state = "hurt";
    h.animTime = 0;

   if (healthRef.current <= 0) {
  setGameOver(true);
  setIsStarted(false);

  if (!roundSavedRef.current) {
    roundSavedRef.current = true;
    try {
      onRoundEnd?.({
        score: scoreRef.current || 0,
        coins: coinCountRef.current || 0,
      });
    } catch (e) { /* ignore */ }

     try {
      addScore?.(scoreRef.current || 0, true);
    } catch (e) { /* ignore */ }
  }
}


    continue;
  }

  if (ob.x + ob.w < -140) obstaclesRef.current.splice(i, 1);
}

// coins update 
for (let i = coinsRef.current.length - 1; i >= 0; i--) {
  const c = coinsRef.current[i];

  c.vx = -Math.round(currentSpeedRef.current);
  c.x += c.vx * dt;

  c.animTime = c.animTime ?? 0;
  if (!c.collected) {
    c.animTime += dt;
    c.y += Math.sin(c.animTime * 2.1) * 0.2;
  } else {
    // collected: run pop animation (scale & rise)
    c.animTime += dt;

    if (c.animTime > 0.45) {
      coinsRef.current.splice(i, 1);
      continue;
    }
  }

  // collision with hero (simple AABB, similar to obstacle)
  const hx = h.x + h.w / 2;
  const hy = h.y + h.h / 2;
  const obx = c.x + c.w / 2;
  const oby = c.y + c.h / 2;
  const collided =
    Math.abs(hx - obx) < (h.w / 2 + c.w / 2 - 6) &&
    Math.abs(hy - oby) < (h.h / 2 + c.h / 2 - 6);

  if (collided && !c.collected) {
    // mark collected and trigger pop animation
    c.collected = true;
    c.animTime = 0;

setCoinCount((prev) => {
  const nv = prev + 1;
  coinCountRef.current = nv;
  return nv;
});

try {
    addCoins?.(1);
  } catch (e) { /* ignore */ }


    // spawn sparkle particles (small)
    for (let p = 0; p < 8; p++) {
      particlesRef.current.push({
        x: c.x + c.w / 2 + (Math.random() - 0.5) * 20,
        y: c.y + c.h / 2 + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 160,
        vy: -100 - Math.random() * 140,
        life: 0.5 + Math.random() * 0.6,
      });
    }

    try {
      if (!sfxRef.current.coin) {
        sfxRef.current.coin = new Audio("/assets/sfx/coin.wav");
        sfxRef.current.coin.preload = "auto";
      }
      const cSfx = sfxRef.current.coin;
      cSfx.currentTime = 0;
      cSfx.play().catch(()=>{});
    } catch { /* ignore */ }
  }

  // remove off-screen coins
  if (c.x + c.w < -140) coinsRef.current.splice(i, 1);
}



  // update particles
  for (let i = particlesRef.current.length - 1; i >= 0; i--) {
    const p = particlesRef.current[i];
    p.vy += GRAVITY * 0.001 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particlesRef.current.splice(i, 1);
  }

  // DRAW PREP
  ctx.clearRect(0, 0, vw, vh);
  ctx.imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = "high";

  try {
    const mapVideo = bgVideoRef.current;
    const nowMs = performance.now();

    const lastAttempt = (lastBgPlayAttemptRef && typeof lastBgPlayAttemptRef.current === "number")
      ? lastBgPlayAttemptRef.current
      : 0;

    if (
      mapVideo &&
      bgVideoReadyRef.current &&
      mapVideo.paused &&
      (musicUnlockedRef.current || sfxRef.current.unlocked || mapVideo.muted)
    ) {
      if (nowMs - lastAttempt > 1500) {
        if (lastBgPlayAttemptRef && typeof lastBgPlayAttemptRef.current === "number") {
          lastBgPlayAttemptRef.current = nowMs;
        }
        mapVideo.play().catch(() => {});
      }
    }
  } catch (e) {
    // swallow — we don't want a play attempt to break the frame
  }

  drawBackground(ctx, vw, vh);

  // PARALLAX STRIPS 
  const bgStrip = bgCanvasRef.current;
  const hillsStrip = hillsCanvasRef.current;
  const treesStrip = treesCanvasRef.current;

if (isStarted && !gameOver) {
  bgOffsetRef.current += currentSpeedRef.current * dt;
}

const base = bgOffsetRef.current;

  if (bgStrip) {
    const bgOffset = Math.floor(base * bgFactor) % bgStrip.width;
    for (let x = -bgOffset; x < vw; x += bgStrip.width) {
      ctx.drawImage(bgStrip, x, 0, bgStrip.width, bgStrip.height);
    }
  }

  if (hillsStrip) {
    const hillsOffset = Math.floor(base * hillsFactor) % hillsStrip.width;
    for (let x = -hillsOffset; x < vw; x += hillsStrip.width) {
      ctx.drawImage(hillsStrip, x, 0, hillsStrip.width, hillsStrip.height);
    }
  } else {
    drawHillsForMap(ctx, selectedMap, vw, vh);
  }

  if (treesStrip) {
    const treesOffset = Math.floor(base * treesFactor) % treesStrip.width;
    for (let x = -treesOffset; x < vw; x += treesStrip.width) {
      ctx.drawImage(treesStrip, x, 0, treesStrip.width, treesStrip.height);
    }
  } else {
    const trees = buildTreeCache(vw, selectedMap);
let minTreeDistance = 100; // default spacing

switch (selectedMap) {
  case "desert": minTreeDistance = 400; break;
  case "arctic": minTreeDistance = 100; break;
  case "forest": minTreeDistance = 100; break;
  case "default": minTreeDistance = 140; break;
  case "beach": minTreeDistance = 120; break;
  case "haunted": minTreeDistance = 50; break;
  case "bangu": minTreeDistance = 120; break;
}

const spacedTrees = thinTrees(trees, minTreeDistance);
drawTreesForMap(ctx, selectedMap, spacedTrees, groundTop);
  }

  // tiled ground
  const tile = buildGroundTile(260, 140, grassBand, selectedMap);
  const cols = Math.ceil(vw / tile.width) + 1;

  const tileW = (tile && tile.width) || 1;
let groundOffset = Math.floor(base * groundScrollFactor) % tileW;
// normalize to positive range 0..tileW-1 (JS % can produce negative)
groundOffset = ((groundOffset % tileW) + tileW) % tileW;

  for (let i = 0; i < cols; i++) {
    const tx = i * tile.width - groundOffset;
    const gy = groundTop;
    ctx.drawImage(tile, tx, gy, tile.width, tile.height);
  }

  // horizon shadow
  ctx.fillStyle = "rgba(0,0,0,0.02)";
  ctx.fillRect(0, groundTop + grassBand - 2, vw, 6);

  // obstacles draw
  for (const ob of obstaclesRef.current) {
    ctx.save();

    // shadow
    ctx.beginPath();
    ctx.ellipse(ob.x + ob.w / 2, ob.y + ob.h + 6, ob.w * 0.55, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fill();

    const img = assetsRef.current[ob.type];
    if (img && img.complete && img.width > 0) {
      try {
        ctx.drawImage(img, ob.x, ob.y, ob.w, ob.h);
      } catch {
        ctx.fillStyle = "#302832d2";
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      }
    } else {
      ctx.fillStyle = "#8b8b8b";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    }
    ctx.restore();
  }

  // draw coins 
const coinImg = assetsRef.current["coin"];
for (const c of coinsRef.current) {
  ctx.save();

  // compute animation scale
  let scale = 1;
  if (c.collected) {
    // easing: pop and fade while rising
    const t = Math.min(1, c.animTime / 0.45);
    scale = 1 + 0.6 * Math.sin(t * Math.PI); // pop
    ctx.globalAlpha = 1 - t * 1.0;
    // rise
    const rise = Math.round(t * 28);
    ctx.translate(0, -rise);
  } else {
    // small bob scale
    scale = 1 + Math.sin((c.animTime || 0) * 3.1) * 0.04;
  }

  const dw = Math.round(c.w * scale);
  const dh = Math.round(c.h * scale);
  const dx = Math.round(c.x - dw / 2);
  const dy = Math.round(c.y - dh / 2);

  if (coinImg && coinImg.complete && coinImg.width > 0) {
    try {
      ctx.drawImage(coinImg, dx, dy, dw, dh);
    } catch {
      // fallback shape
      ctx.fillStyle = "#ffd54f";
      ctx.beginPath();
      ctx.ellipse(dx + dw/2, dy + dh/2, dw/2, dh/2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // placeholder
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.ellipse(dx + dw/2, dy + dh/2, dw/2, dh/2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}


  // particles
  for (const p of particlesRef.current) {
    ctx.fillStyle = "rgba(60,60,60,0.95)";
    ctx.fillRect(p.x, p.y, 3, 3);
  }

  // draw runner (uses character video or frames)

  const size = Math.min(96, Math.max(40, Math.floor(vw / 8)));
  const heroY = heroRef.current.y;
  const vv = videoRef.current; 

  if (heroRef.current.state === "hurt" && heroImgs.current.hurt) {
    ctx.drawImage(heroImgs.current.hurt!, heroRef.current.x, heroY, size, size);
  } 

  else if (heroRef.current.state === "jump" && heroImgs.current.jump) {
    ctx.drawImage(heroImgs.current.jump!, heroRef.current.x, heroY, size, size);
  } 
  
  else {
    if (vv && videoLoadedRef.current && !vv.paused && videoPlayingRef.current) {
      try {
        ctx.drawImage(vv, heroRef.current.x, heroY, size, size);
      } catch {
        const walkImg = heroRef.current.frame === 0 ? heroImgs.current.w1 : heroImgs.current.w2;
        if (walkImg) ctx.drawImage(walkImg, heroRef.current.x, heroY, size, size);
        else ctx.fillRect(heroRef.current.x, heroY, size, size);
      }
    } else {
      if ((musicUnlockedRef.current || sfxRef.current.unlocked) && vv && !videoPlayRequestedRef.current) {
        videoPlayRequestedRef.current = true;
        vv.play().catch(()=>{ videoPlayRequestedRef.current = false; });
      }

      // gif fallback
      if (heroImgs.current.gif && heroImgs.current.gif.complete) {
        ctx.drawImage(heroImgs.current.gif, heroRef.current.x, heroY, size, size);
      } else {
        const walkImg = heroRef.current.frame === 0 ? heroImgs.current.w1 : heroImgs.current.w2;
        if (walkImg) ctx.drawImage(walkImg!, heroRef.current.x, heroY, size, size);
        else {
          ctx.fillStyle = "black";
          ctx.fillRect(heroRef.current.x, heroY, size, size);
        }
      }
    }
  }

  // weather overlay and particles
  updateWeather(now, ctx, vw, vh, groundTop);

  // continue or stop RAF
  if (!gameOver) {
    rafRef.current = requestAnimationFrame(step);
  } else {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }
}


    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loaded, isStarted, selectedMap, gameOver]);

  // restart handlers
  useEffect(() => {
    function onRestartClick() {
      if (!gameOver) return;
      obstaclesRef.current = [];
      particlesRef.current = [];
      OB_ID.current = 1;
      currentSpeedRef.current = RUN_SPEED * SPEED_MIN_MULT;
      startTimeRef.current = null;
      setScore(0);
      scoreRef.current = 0;
      setGameOver(false);
      setIsStarted(false);
    }
    window.addEventListener("click", onRestartClick);
    return () => window.removeEventListener("click", onRestartClick);
  }, [gameOver]);


  function handleStart() {

  bgOffsetRef.current = 0;
  // reset spawn/timers/state
  obstaclesRef.current = [];
  coinsRef.current = [];
  COIN_ID.current = 1;
  particlesRef.current = [];
  OB_ID.current = 1;

  // speed + timing
  currentSpeedRef.current = RUN_SPEED * SPEED_MIN_MULT;
  startTimeRef.current = performance.now();
  lastSpawnRef.current = performance.now();

  // score / coins / health
  scoreRef.current = 0;
  setScore(0);

  coinCountRef.current = 0;   
  setCoinCount(0);

  healthRef.current = 100;
  setHealth(100);

  // round save guard
  roundSavedRef.current = false;

  // gameplay flags
  setIsStarted(true);
  setGameOver(false);

  videoPlayRequestedRef.current = false;
}

  return (
    <>
<div className="game-shell">
  <style>{`
    :root{
      --card-bg: #ffffff;
      --glass: rgba(255,255,255,0.9);
      --accent1: #2b88ff;
      --accent2: #4da6ff;
      --danger: #ff6b6b;
      --muted: #9aa3ad;
      --shadow: 0 18px 42px rgba(16,24,40,0.12);
      --soft-shadow: 0 8px 20px rgba(16,24,40,0.06);
      --radius: 14px;
    }

    .game-shell{
      width:97vw;
      height:97vh;
      min-height:95svh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:0;
      box-sizing:border-box;
      font-family: sans-serif;
      background: radial-gradient(circle at 55% 15%, #b6e3ff 0%, #f4faff 40%, #e9eef4 100%);
      overflow:hidden;
    }

    .game-stage{
      position:relative;
      width:97vw;
      height:97vh;
      display:block;
      max-width:1100px;
      max-height:900px;
      box-sizing:border-box;
      margin:0 auto;
      padding:0;
    }

    /* HUD card (top-left) */
    .hud {
      position: absolute;
      top: clamp(10px, 2.2vh, 22px);
      left: clamp(10px, 2.2vw, 22px);
      display:flex;
      gap: 12px;
      align-items:center;
      background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,249,255,0.96));
      padding: 10px 12px;
      border-radius: 14px;
      box-shadow: var(--soft-shadow);
      z-index: 60;
      transform: translateZ(0);
      backdrop-filter: blur(4px) saturate(120%);
      width: 280px;
    }

    .hp-label { font-weight:800; font-size:clamp(12px,1.4vw,14px); }
    .hp-wrap { width: 140px; height: 9px; margin-top: 2; background:#f0f0f0; border-radius:999px; overflow:hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
    .hp-fill {
      height:100%;
      background: linear-gradient(90deg, var(--accent2) 0%, var(--accent1) 70%);
      transition: width 300ms linear;
      box-shadow: inset 0 -6px 18px rgba(11,88,180,0.08);
    }

    .score-badge {
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding:8px 12px;
      border-radius:999px;
      background: linear-gradient(90deg, rgba(43,136,255,0.09), rgba(77,166,255,0.06));
      border: 1px solid rgba(43,136,255,0.09);
      font-weight:800;
      color: #114a88;
      font-size:clamp(12px,1.6vw,14px);
      box-shadow: var(--soft-shadow);
    }

    .hud-btn {
      border: none;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 10px;
      color: white;
      font-weight:800;
      background: linear-gradient(90deg, #ff6868, #ffb468);
      box-shadow: var(--shadow);
      font-size:13px;
    }

    /* canvas container */
    .game-canvas {
      box-shadow: 0 28px 60px rgba(0,0,0,0.08);
      cursor: crosshair;
      width:100%;
      height:100%;
      display:block;
      border-radius: 12px;
      background: transparent;
      position:relative;
      overflow:hidden;
    }

    /* overlays */
    .overlay {
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:70;
      pointer-events:none;
    }
    .panel {
      pointer-events:all;
      width: min(520px, 92vw);
      border-radius: 14px;
      padding: 20px;
      text-align:center;
      box-shadow: var(--shadow);
      background: linear-gradient(180deg, var(--card-bg), #f6fbff);
    }
    h2.title {
      margin:0;
      font-size: clamp(18px,3.2vw,26px);
      font-weight:900;
      letter-spacing:1.2px;
    }
    p.lead { margin-top:12px; font-size:14px; color:var(--muted); }

    .primary-btn {
      margin-top:14px;
      padding:12px 18px;
      border-radius: 12px;
      background: linear-gradient(90deg, var(--accent1), var(--accent2));
      border: none;
      color: white;
      font-weight:900;
      cursor:pointer;
      font-size: 15px;
      box-shadow: 0 8px 20px rgba(43,136,255,0.18);
    }

    .muted-note { margin-top:10px; font-size:13px; color:#6b7280; }

    /* gameover */
    .gameover-card { width: min(480px,86vw); padding:18px; border-radius:14px; pointer-events:all; }

    /* loading overlay */
    .loading-card { width: min(360px,86vw); padding:16px; border-radius:12px; pointer-events:all; }

    /* subtle animated accent (floating coin) */
    .accent-coin {
      position:absolute;
      right: clamp(12px,2.6vw,20px);
      top: clamp(16px,2.6vh,20px);
      width:44px;
      height:44px;
      border-radius:999px;
      background: radial-gradient(circle at 35% 30%, #fff9c8, #ffd54d);
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow: 0 8px 20px rgba(255,168,40,0.18), inset 0 -6px 18px rgba(0,0,0,0.06);
      z-index:65;
      transform-origin:center;
      animation: floaty 4200ms ease-in-out infinite;
      pointer-events:none;
    }
    @keyframes floaty {
      0% { transform: translateY(0) scale(1); opacity:1; }
      50% { transform: translateY(-6px) scale(1.02); opacity:0.95; }
      100%{ transform: translateY(0) scale(1); opacity:1; }
    }

    /* responsive layout tweaks */
    @media (max-width: 720px) {
      .hud { gap:10px; padding:8px; }
      .hp-wrap { width: 80px; }
      .primary-btn { padding: 10px 14px; }
    }
  `}</style>

  <div className="game-stage">
    {/* HUD */}
    <div className="hud" role="status" aria-live="polite">
      <div style={{display:'flex', flexDirection:'column', gap:4,      fontFamily: "sans-serif"
}}>
        <div style={{display:'flex', alignItems:'center', gap:5}}>
          <div className="hp-label">❤️ HP</div>
          <div style={{fontSize:12, color:'var(--muted)'}}> </div>
        </div>

        <div className="hp-wrap" aria-hidden>
          <div className="hp-fill" style={{ width: `${Math.max(0, Math.min(100, healthRef.current))}%` }} />
        </div>
      </div>

      <div style={{ width: 4 }} />

      <div className="score-badge" aria-label={`Score ${score}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" style={{opacity:0.95}}><path fill="#2b88ff" d="M12 2L15 9H22L16.5 13L19 20L12 16L5 20L7.5 13L2 9H9L12 2Z"/></svg>

        <div style={{display:'flex', flexDirection:'row', lineHeight:1}}>
          <div style={{fontSize:11, color:'#0e3a66'}}>Score:</div>
          <div style={{fontWeight:700, color:'#103c66', fontSize:11, marginLeft:3, position:'relative', top:0  }}>{score}</div>
        </div>
      </div>

      <div style={{ width: 2 }} />
      

      <div className="score-badge" aria-label={`Coins collected`}>
    <img src="/assets/Tiles/Default/star.png" alt="Coin" style={{ width: 20, height: 20 }} />
    <div style={{ fontWeight: 700, marginLeft: 0 }}>{coinCount}</div>
  </div>


    
    </div>

    

    {/* Canvas */}
    <canvas ref={canvasRef} className="game-canvas" />

   
{!loaded && (
  <div className="overlay" style={{ pointerEvents: 'none' }}>
    <div
      className="panel loading-card gs-loading-panel"
      style={{ pointerEvents: 'all', background: 'none' }}
      role="status"
      aria-live="polite"
      aria-label="Game initializing, loading assets"
    >
      <style>{`
        /* GS = gamified spinner (unique prefix) */
        .gs-loading-panel { display:flex; flex-direction:column; align-items:center; gap:10px; padding:18px; }
        .gs-spinner { width:128px; height:128px; position:relative; transform:translateZ(0); }
        /* rotating wheel (conic cartoon segments) */
        .gs-wheel {
          width:100%; height:100%; border-radius:50%;
          background: conic-gradient(
            #ffd54d 0deg 90deg,
            #ff8a65 90deg 180deg,
            #4db6ff 180deg 260deg,
            #8bd18d 260deg 360deg
          );
          box-shadow: 0 10px 30px rgba(15,20,30,0.12), inset 0 -10px 24px rgba(0,0,0,0.06);
          border: 6px solid rgba(255,255,255,0.55);
          position:relative;
          animation: gs-rotate 1600ms linear infinite;
        }

        /* inner emblem (badge) */
        .gs-center {
          position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
          width:56px; height:56px; border-radius:50%;
          background: linear-gradient(180deg,#ffffff,#fff0d6);
          box-shadow: 0 6px 18px rgba(20,30,40,0.12);
          display:flex; align-items:center; justify-content:center; z-index:2;
          border:2px solid rgba(0,0,0,0.06);
        }

        /* tiny hero silhouette (SVG path sits inside) */
        .gs-hero { width:34px; height:34px; transform-origin:center; animation: gs-hero-bounce 900ms ease-in-out infinite; }

        /* orbiting icons */
        .gs-orbit {
          position:absolute; inset:0; pointer-events:none;
        }
        .gs-orbit .icon {
          position:absolute; width:18px; height:18px; border-radius:6px;
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 6px 14px rgba(10,12,15,0.12);
        }
        .gs-orbit .icon.i1 { left:8%; top:40%; background:#ffd54d; transform:translate(-50%,-50%); animation: gs-orbit1 2000ms linear infinite; }
        .gs-orbit .icon.i2 { right:10%; top:22%; background:#ff8a65; transform:translate(50%,-50%); animation: gs-orbit2 2400ms linear infinite; }
        .gs-orbit .icon.i3 { left:50%; bottom:6%; background:#8bd18d; transform:translate(-50%,50%); animation: gs-orbit3 2200ms linear infinite; }

        /* subtle pulsing shadow under spinner */
        .gs-shadow {
          width:84px; height:14px; background: radial-gradient(ellipse at center, rgba(0,0,0,0.14), rgba(0,0,0,0.06) 60%, transparent 100%);
          border-radius:999px; margin-top:6px; animation: gs-shadow-pulse 900ms ease-in-out infinite;
        }

        /* small texts */
        .gs-title { font-weight:800; font-size:15px; color:#243449; margin-top:6px; letter-spacing:0.6px; }
        .gs-sub { font-size:13px; color:#5b636b; opacity:0.95; margin-top:2px; }

        /* keyframes */
        @keyframes gs-rotate { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        @keyframes gs-hero-bounce {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes gs-orbit1 {
          0% { transform: translate(0,0) rotate(0deg) translateX(0); opacity:1; }
          100% { transform: translate(0,0) rotate(360deg) translateX(0); opacity:1; }
        }
        @keyframes gs-orbit2 {
          0% { transform: translate(0,0) rotate(0deg) translateX(0); opacity:1; }
          100% { transform: translate(0,0) rotate(-360deg) translateX(0); opacity:1; }
        }
        @keyframes gs-orbit3 {
          0% { transform: translate(0,0) rotate(0deg) translateX(0); opacity:1; }
          100% { transform: translate(0,0) rotate(360deg) translateX(0); opacity:1; }
        }
        @keyframes gs-shadow-pulse {
          0% { transform: scaleX(0.98); opacity:0.9; }
          50% { transform: scaleX(1.06); opacity:0.75; }
          100% { transform: scaleX(0.98); opacity:0.9; }
        }

        /* put orbit icons along curved path by translating (cheap, visual only) */
        .gs-orbit .i1 { transform-origin: 10% 50%; }
        .gs-orbit .i2 { transform-origin: 90% 20%; }
        .gs-orbit .i3 { transform-origin: 50% 95%; }

        /* accessibility: respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .gs-wheel, .gs-hero, .gs-orbit .icon, .gs-shadow { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* spinner group */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="gs-spinner" aria-hidden="false">
          <div className="gs-wheel" aria-hidden="true" />

          <div className="gs-center" aria-hidden="true">
            {/* playful hero SVG - simple runner silhouette */}
            <svg className="gs-hero" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M6 18c1-3 4-4 7-4l2-2c-1-1-1-3 1-4 2-1 3 0 3 0l-1 3s-2 1-2 3c0 2 2 4 2 4l-6 1s-4-1-6-5z" fill="#2b88ff" opacity="0.95"/>
              <circle cx="9" cy="6" r="1.8" fill="#ffd54d"/>
            </svg>
          </div>

          {/* orbiting tiny tokens */}
          <div className="gs-orbit" aria-hidden="true">
            <div className="icon i1" title="Coin">
              <svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#ffd54d"/><text x="50%" y="55%" textAnchor="middle" fontSize="10" fill="#6b3f00" fontWeight="700">৳</text></svg>
            </div>
            <div className="icon i2" title="Star">
              <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#ff8a65" d="M12 .9l2.5 5.6 6.1.9-4.4 4.2 1 6.1L12 16l-5.2 2.7 1-6.1L3.4 7.4 9.5 6.5z"/></svg>
            </div>
            <div className="icon i3" title="Leaf">
              <svg width="12" height="12" viewBox="0 0 24 24"><path d="M2 12s6-8 14-9c-3 4-8 7-10 11-1.7 3.3-4 7-4 7S3.5 16.2 2 12z" fill="#8bd18d"/></svg>
            </div>
          </div>
        </div>

        {/* pulsing shadow */}
        <div className="gs-shadow" aria-hidden="true"></div>

        
      </div>
    </div>
  </div>
)}


    {/* Start menu */}
    {!isStarted && !gameOver && loaded && (

      <div className="overlay" aria-hidden={!loaded} >
        <div className="panel" role="dialog" aria-modal="true">
          <h2 className="title">🏃 Runner — {selectedMap}</h2>
          <p className="lead">Tap / Click or press <strong>Space</strong> to jump. Run faster and avoid obstacles!</p>

          <button className="primary-btn" onClick={handleStart} aria-label="Start game">▶ Start Game</button>

          {!allAssetsLoaded && <div className="muted-note">Loading remaining assets in background…</div>}
        </div>
      </div>
    )}

    {/* Game over */}
    {gameOver && (
      <div className="overlay" aria-hidden={!gameOver} >
        <div className="panel gameover-card" role="dialog" aria-modal="true" style={{background:'linear-gradient(180deg,#fff8f8,#fffef2)'}}>
          <h2 className="title" style={{color:'#d9534f'}}>💀 Game Over</h2>
          <div style={{marginTop:12, fontSize:16}}>Your score: <strong>{score}</strong> </div>

          <div style={{display:'flex', justifyContent:'center', gap:12, marginTop:14}}>

            <button className="primary-btn" onClick={() => { 
  setIsStarted(true); 
  setGameOver(false); 
  obstaclesRef.current = []; 
  coinsRef.current = [];
  COIN_ID.current = 1;
  particlesRef.current = []; 
  OB_ID.current = 1; 
  setCoinCount(0);
}}>
  🔄 Restart
</button>

    <button className="hud-btn" onClick={() => {
    setIsStarted(false);
    setGameOver(false);
    onExit?.();
  }}
   style={{background:'linear-gradient(90deg,#ff8a80,#ffb3a7)'}}
   >
    Exit
    </button>

          </div>
        </div>
      </div>
    )}
  </div>
</div>
</>
  );
}
