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

export type SheetView = z.infer<typeof sheetViewSchema>;

export function readSheetView(value: unknown): SheetView {
  const parsed = sheetViewSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}
