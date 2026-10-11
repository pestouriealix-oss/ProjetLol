import type { Role } from "@/lib/config";

/**
 * Géométrie de la carte tactique, dans un repère 100 × 100 (origine en haut à
 * gauche). C'est un schéma original, pas une reproduction de la carte du jeu :
 * trois voies, la rivière en diagonale, les deux bases dans les coins.
 * Notre base est en bas à gauche.
 */

export type MapPoint = readonly [x: number, y: number];

export const MAP_SIZE = 100;

export const LANES = {
  top: "M11 84 V20 Q11 11 20 11 H84",
  mid: "M16 84 L84 16",
  bot: "M16 89 H80 Q89 89 89 80 V16",
} as const;

export const RIVER = "M19 20 C33 34 42 43 50 50 S67 66 81 80";

/** Les deux antres de la rivière (grands objectifs). */
export const PITS: readonly MapPoint[] = [
  [35, 36],
  [65, 64],
];

export const BASES = {
  ours: [9, 91],
  theirs: [91, 9],
} as const satisfies Record<string, MapPoint>;

/** Camps de la jungle : de simples repères pour lire les quartiers. */
export const CAMPS: readonly MapPoint[] = [
  // Notre jungle, côté haut puis côté bas
  [24, 48],
  [31, 58],
  [21, 61],
  [50, 73],
  [42, 79],
  [59, 80],
  // Leur jungle, côté haut puis côté bas
  [50, 27],
  [58, 21],
  [41, 20],
  [76, 52],
  [69, 42],
  [79, 39],
];

/** Où se tient chaque rôle pendant la phase de voies. */
export const ALLY_POSITIONS: Record<Role, MapPoint> = {
  TOP: [11, 28],
  JUNGLE: [50, 73],
  MID: [45, 55],
  ADC: [74, 89],
  SUPPORT: [62, 89],
};

export const ENEMY_POSITIONS: Record<Role, MapPoint> = {
  TOP: [28, 11],
  JUNGLE: [50, 27],
  MID: [55, 45],
  ADC: [89, 74],
  SUPPORT: [89, 62],
};

/** Un trajet dessiné par le coach, de la position du joueur vers un objectif. */
export type MapRoute = {
  id: string;
  /** Tracé SVG, qui part de la position du joueur. */
  d: string;
  /** Point d'arrivée, là où le signal apparaît. */
  target: MapPoint;
};
