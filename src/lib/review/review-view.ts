import { z } from "zod";

import { reviewFactsSchema, type ReviewFacts } from "@/lib/stats/review";

/**
 * Le bilan tel que la page l'affiche : complet une fois écrit, partiel pendant
 * l'écriture (champs absents, texte coupé, liste en cours). Tout champ
 * illisible est simplement ignoré, jamais une erreur.
 */

const text = z.string().optional().catch(undefined);

const point = z.object({ title: text, detail: text }).catch({});

export const reviewViewSchema = z.object({
  summary: text,
  strengths: z.array(point).optional().catch(undefined),
  improvements: z
    .array(
      z
        .object({
          title: text,
          detail: text,
          options: z.array(z.string().catch("")).optional().catch(undefined),
        })
        .catch({}),
    )
    .optional()
    .catch(undefined),
});

export type ReviewView = z.infer<typeof reviewViewSchema> & { facts?: ReviewFacts };

export function readReviewView(value: unknown, facts?: unknown): ReviewView {
  const parsed = reviewViewSchema.safeParse(value);
  const review = parsed.success ? parsed.data : {};
  const readFacts = reviewFactsSchema.safeParse(facts);
  return readFacts.success ? { ...review, facts: readFacts.data } : review;
}

export { reviewFactsSchema };
