import { z } from "zod";

import { winConditionsSchema } from "./win-conditions";
import { matchupSchema } from "./draft-matchup";

/**
 * Fiche de draft : conditions de victoire des deux équipes et duel contre le
 * vis-à-vis. Elle est écrite en deux appels parallèles (voir `win-conditions.ts`
 * et `draft-matchup.ts`) : le duel ne dépend que des deux champions, il peut
 * donc resservir à tous les joueurs du même patch.
 *
 * Version à changer à chaque modification d'un des deux prompts ou du schéma
 * (elle est enregistrée avec chaque fiche).
 */
export const DRAFT_SHEET_VERSION = "draft-sheet@5";

export const draftSheetSchema = z.object({
  winConditions: winConditionsSchema,
  matchup: matchupSchema,
});

export type DraftSheet = z.infer<typeof draftSheetSchema>;

export { ROLE_NAMES, type ChampionSheet, type GameRecord } from "./shared";
