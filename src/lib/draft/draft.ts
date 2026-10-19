import { z } from "zod";

import { ROLES, type Role } from "@/lib/config";

/**
 * Une draft : les champions des deux équipes, rangés par rôle, et le rôle du
 * joueur. Les champions sont désignés par leur identifiant Data Dragon
 * (« LeeSin », « MonkeyKing »). Une case peut rester vide.
 */

const championId = z
  .string()
  .regex(/^[A-Za-z0-9]{2,32}$/)
  .nullable();

const sideSchema = z.strictObject({
  TOP: championId,
  JUNGLE: championId,
  MID: championId,
  ADC: championId,
  SUPPORT: championId,
});

export const draftSchema = z.strictObject({
  allies: sideSchema,
  enemies: sideSchema,
  myRole: z.enum(ROLES),
});

export type DraftSide = z.infer<typeof sideSchema>;
export type Draft = z.infer<typeof draftSchema>;

export function emptySide(): DraftSide {
  return { TOP: null, JUNGLE: null, MID: null, ADC: null, SUPPORT: null };
}

export function emptyDraft(myRole: Role): Draft {
  return { allies: emptySide(), enemies: emptySide(), myRole };
}

/** Il faut au moins son champion et son vis-à-vis pour écrire une fiche. */
export function canAnalyse(draft: Draft): boolean {
  return draft.allies[draft.myRole] !== null && draft.enemies[draft.myRole] !== null;
}

/** Nombre de cases remplies (sur dix). */
export function filledCount(draft: Draft): number {
  return [...Object.values(draft.allies), ...Object.values(draft.enemies)].filter(Boolean).length;
}

/** Un même champion ne peut pas être deux fois dans la partie. */
export function duplicateChampions(draft: Draft): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of [...Object.values(draft.allies), ...Object.values(draft.enemies)]) {
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

/**
 * Range des choix dans les rôles : d'abord ceux dont le rôle est connu (si la
 * place est libre), puis les autres dans l'ordre, aux places restantes.
 */
export function assignRoles(
  picks: readonly { champion: string | null; role: Role | null }[],
): DraftSide {
  const side = emptySide();
  const pending: string[] = [];
  for (const pick of picks.slice(0, 5)) {
    if (!pick.champion) continue;
    if (pick.role && side[pick.role] === null) side[pick.role] = pick.champion;
    else pending.push(pick.champion);
  }
  for (const role of ROLES) {
    if (side[role] === null && pending.length > 0) side[role] = pending.shift()!;
  }
  return side;
}
