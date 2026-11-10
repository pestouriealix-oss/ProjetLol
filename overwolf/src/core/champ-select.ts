import { z } from "zod";

import type { Role } from "@/lib/config";

import { parseMaybeJson } from "./launcher";

/** Le poste annoncé par le lanceur → celui du site. */
const POSITIONS: Record<string, Role> = {
  top: "TOP",
  jungle: "JUNGLE",
  middle: "MID",
  bottom: "ADC",
  utility: "SUPPORT",
};

const rawSchema = z.object({
  localPlayerCellId: z.number(),
  myTeam: z.array(
    z.object({
      cellId: z.number(),
      championId: z.number().catch(0),
      championPickIntent: z.number().catch(0),
      assignedPosition: z.string().catch(""),
    }),
  ),
});

export type ChampSelect = {
  /** Numéro du champion choisi, ou survolé avant son tour ; `null` s'il n'y en a pas encore. */
  championKey: number | null;
  /** Vrai tant que le champion n'est qu'une intention (pas encore choisi). */
  intent: boolean;
  /** Le poste attribué (parties classées et normales avec postes), sinon `null`. */
  role: Role | null;
};

/**
 * Ce que l'app retient de la sélection : le champion et le poste du joueur,
 * rien d'autre. Ni pseudo, ni champion adverse (le lanceur les cache de toute
 * façon), conformément aux règles de Riot.
 */
export function readChampSelect(raw: unknown): ChampSelect | null {
  const parsed = rawSchema.safeParse(parseMaybeJson(raw));
  if (!parsed.success) return null;
  const me = parsed.data.myTeam.find((player) => player.cellId === parsed.data.localPlayerCellId);
  if (!me) return null;
  const picked = me.championId > 0 ? me.championId : null;
  const hovered = me.championPickIntent > 0 ? me.championPickIntent : null;
  return {
    championKey: picked ?? hovered,
    intent: picked === null && hovered !== null,
    role: POSITIONS[me.assignedPosition.toLowerCase()] ?? null,
  };
}
