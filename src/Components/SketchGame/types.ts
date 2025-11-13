export type Point = { x: number; y: number };

export type Shield = {
  id: number;
  points: Point[];
  thickness: number;
  maxDurability: number;
  durability: number;
  anchored: boolean;
  createdAt: number;
};

export type DangerTypeKey =
  | "block_plank"
  | "slime"
  | "saw"
  | "weight"
  | "saw_tile"
  | "rock"
  | "fireball"
  | "chain"
  | "brick_grey"
  | "brick_brown"
  | "brick_brown_diag"
  | "spikes"
  | "block_planks"
  | "hasina"
  | "joy"
  | "kader"
  | "murgi"
  ;


export type Danger = {
  id: number;
  typeKey: DangerTypeKey;
  img: HTMLImageElement | null;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVel: number;
  mass: number;
  hp: number;
  maxHp: number;
  baseDamage: number;
  clickedTimes: number;
  broken: boolean;
};

