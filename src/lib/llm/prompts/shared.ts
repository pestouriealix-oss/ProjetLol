import type { Role } from "@/lib/config";

/** Ce que les prompts de la fiche de draft ont en commun. */

export const ROLE_NAMES: Record<Role, string> = {
  TOP: "haut",
  JUNGLE: "jungle",
  MID: "milieu",
  ADC: "tireur",
  SUPPORT: "support",
};

/** Fiche technique d'un champion, telle que Data Dragon la donne. */
export type ChampionSheet = {
  name: string;
  passive: { name: string; text: string };
  spells: { key: string; name: string; cooldown: string; text: string }[];
};

/** Résultats de parties classées (compteurs bruts). */
export type GameRecord = { games: number; wins: number };
