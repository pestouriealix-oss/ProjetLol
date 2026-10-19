import { z } from "zod";

/**
 * La fiche telle que la page l'affiche : complète une fois écrite, partielle
 * pendant l'écriture (champs absents, texte coupé, liste en cours). Tout champ
 * illisible est simplement ignoré, jamais une erreur.
 */

const text = z.string().optional().catch(undefined);

export const VERDICTS = ["favorable", "even", "unfavorable"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const sheetViewSchema = z.object({
  winConditions: z.object({ ours: text, theirs: text }).optional().catch(undefined),
  matchup: z
    .object({
      verdict: z.enum(VERDICTS).optional().catch(undefined),
      summary: text,
      keyMoments: text,
      options: z
        .array(z.object({ title: text, detail: text }).catch({}))
        .optional()
        .catch(undefined),
      watchOut: text,
    })
    .optional()
    .catch(undefined),
});

/**
 * Les données vérifiées sur lesquelles la fiche s'appuie, gardées avec elle :
 * statistiques de parties classées et version de Data Dragon.
 */
export const sheetFactsSchema = z.object({
  /** Patch du jeu au moment de la fiche (« 16.20 »). */
  patch: z.string(),
  /** Version de Data Dragon d'où viennent les compétences (« 16.20.1 »). */
  ddragonVersion: z.string(),
  stats: z
    .object({
      /** Patch des statistiques utilisées. */
      patch: z.string(),
      /** Parties classées analysées sur ce patch, tous duels confondus. */
      matches: z.number().int().nonnegative(),
      /** Le duel du joueur contre son vis-à-vis ; `null` s'il n'a jamais été vu. */
      matchup: z
        .object({ games: z.number().int().nonnegative(), wins: z.number().int().nonnegative() })
        .nullable(),
      reliable: z.boolean(),
    })
    .nullable(),
});

export type SheetFacts = z.infer<typeof sheetFactsSchema>;

export type SheetView = z.infer<typeof sheetViewSchema> & { facts?: SheetFacts };

export function readSheetView(value: unknown): SheetView {
  const parsed = sheetViewSchema.safeParse(value);
  const sheet = parsed.success ? parsed.data : {};
  const facts =
    typeof value === "object" && value !== null && "facts" in value
      ? sheetFactsSchema.safeParse(value.facts)
      : null;
  return facts?.success ? { ...sheet, facts: facts.data } : sheet;
}
