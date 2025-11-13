import type { MapKey } from "./config";

export type ImgMap = Record<string, HTMLImageElement | null>;
export type Ob = { id: number; x: number; y: number; w: number; h: number; type: string; big: boolean; vx?: number };
export type WeatherType = "sand" | "snow" | "rain";

export type ParallaxMeta = { map?: MapKey; width?: number; height?: number };
