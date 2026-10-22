import { z } from "zod";

import type { Role } from "@/lib/config";

/** Ce que les prompts du coach ont en commun. */

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

/**
 * Coupe un texte trop long à la dernière phrase entière qui tient, sinon au
 * dernier mot, avec des points de suspension.
 */
export function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  const head = value.slice(0, max);
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentence > max / 2) return head.slice(0, sentence + 1);
  const word = head.lastIndexOf(" ");
  return `${(word > 0 ? head.slice(0, word) : head).replace(/[\s,;:]+$/, "")}…`;
}

/**
 * Un texte écrit par le modèle : jamais vide. Trop long, il est raccourci
 * plutôt que refusé (le mode strict ne peut pas imposer de longueur).
 */
export const modelText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((value) => clip(value, max));

/** Une liste écrite par le modèle : au moins `min` éléments, ceux au-delà de `max` sont ignorés. */
export const modelList = <T extends z.ZodType>(item: T, min: number, max: number) =>
  z
    .array(item)
    .min(min)
    .transform((items) => items.slice(0, max));
