// src/Components/SketchGame/constants.ts
import type { DangerTypeKey } from "./types";

let _SHIELD_ID = 1;
let _DANGER_ID = 1;

export let SHIELD_ID = _SHIELD_ID;
export let DANGER_ID = _DANGER_ID;

export function nextShieldId() {
  const id = _SHIELD_ID++;
  SHIELD_ID = _SHIELD_ID; 
  return id;
}

export function nextDangerId() {
  const id = _DANGER_ID++;
  DANGER_ID = _DANGER_ID; // keep exported live binding up-to-date
  return id;
}

export function resetIds() {
  _SHIELD_ID = 1;
  _DANGER_ID = 1;
  SHIELD_ID = _SHIELD_ID;
  DANGER_ID = _DANGER_ID;
}

export const BG_SRC = "/assets/bg/city_bg.webp";
export const HERO_PATH = "/assets/chars/";
export const HERO_POSES = {
  idle: "hero-1.png",
  idle2: "hero-2.png",
  hurt: "hero-hurt.png",
  fall: "hero-fall.png",
};
export const BREAK_SOUND_SRC = "/assets/sfx/break_sound.wav";
export const HURT_SOUND_SRC = "/assets/sfx/hurt_sound.mp3";

export const GRAVITY = 11.0;
export const SHIELD_BOUNCE = -0.36;
export const SPAWN_INTERVAL_START = 2000;
export const SPAWN_INTERVAL_MIN = 130;
export const SPAWN_ACCEL = 0.9935;
export const MAX_DANGERS = 15;
export const PARTICLE_LOWEND_SCALE = 0.6;
export const LARGE_SIZE_CAP = 56;
export const SMALL_SCALE_BOOST = 1.15;
export const HERO_PROTECTED_RADIUS = 30;
export const HERO_MAX_HIT = 3;
export const HERO_OFFSET = 20;

export const ASSET_MAP: Record<DangerTypeKey, string> = {
  block_plank: "/assets/Tiles/Default/block_plank.png",
  slime: "/assets/enemies/Enemies/Default/slime_block_walk_a.png",
  saw: "/assets/enemies/Enemies/Default/saw_a.png",
  weight: "/assets/Tiles/Default/weight.png",
  saw_tile: "/assets/Tiles/Default/saw.png",
  rock: "/assets/Tiles/Default/rock.png",
  fireball: "/assets/Tiles/Default/fireball.png",
  chain: "/assets/Tiles/Default/chain.png",
  brick_grey: "/assets/Tiles/Default/brick_grey_diagonal.png",
  brick_brown: "/assets/Tiles/Default/brick_brown.png",
  brick_brown_diag: "/assets/Tiles/Default/brick_brown_diagonal.png",
  spikes: "/assets/Tiles/Default/block_spikes.png",
  block_planks: "/assets/Tiles/Default/block_planks.png",
  hasina: "/assets/bal/hasina.png",
  joy: "/assets/bal/joy.png",
  kader: "/assets/bal/kauua kader.png",
  murgi: "/assets/bal/murgi kobir.png"
};

export const DANGER_PROPS = {
  block_plank: { mass: 36, hp: 19, size: 1.04, baseDamage: 3, clickHP: 3 },
  slime: { mass: 25, hp: 13, size: 1.04, baseDamage: 2, clickHP: 4 },
  saw: { mass: 31, hp: 18, size: 1.03, baseDamage: 3, clickHP: 3 },
  weight: { mass: 46, hp: 26, size: 1.0, baseDamage: 5, clickHP: 5 },
  saw_tile: { mass: 24, hp: 18, size: 1.0, baseDamage: 2, clickHP: 3 },
  rock: { mass: 45, hp: 20, size: 1.02, baseDamage: 3, clickHP: 4 },
  fireball: { mass: 21, hp: 20, size: 1.0, baseDamage: 3, clickHP: 4 },
  chain: { mass: 37, hp: 16, size: 1, baseDamage: 5, clickHP: 3 },
  brick_grey: { mass: 27, hp: 20, size: 1.06, baseDamage: 2, clickHP: 3 },
  brick_brown: { mass: 25, hp: 18, size: 1.06, baseDamage: 2, clickHP: 3 },
  brick_brown_diag: { mass: 25, hp: 18, size: 1.07, baseDamage: 3, clickHP: 3 },
  spikes: { mass: 28, hp: 12, size: 1.03, baseDamage: 4, clickHP: 5 },
  block_planks: { mass: 30, hp: 18, size: 1.03, baseDamage: 4, clickHP: 4 },
  hasina: { mass: 25, hp: 15, size: 1.5, baseDamage: 4, clickHP: 3 },
  joy: { mass: 23, hp: 17, size: 1.2, baseDamage: 3, clickHP: 3 },
  kader: { mass: 23, hp: 19, size: 1.3, baseDamage: 3, clickHP: 4 },
  murgi: { mass: 22, hp: 16, size: 1.4, baseDamage: 3, clickHP: 3 },
};

export const ENVS = [
  {
    key: "desert",
    video: "/assets/bg/desert.webm",
    ground: "/assets/ground/desert-ground.jpg",
    weather: "sand"
  },
  {
    key: "beach",
    video: "/assets/bg/beach.webm",
    ground: "/assets/ground/beach-ground.jpg",
    weather: "sand"
  },
  {
    key: "city",
    weather: "dust"
  },
  {
    key: "forest",
    video: "/assets/bg/forest.webm",
    ground: "/assets/ground/forest-ground.jpg",
    weather: "rain"
  },
];
