import "server-only";

import { env } from "@/lib/env";

import { createLlm } from "./client";

/** Le modèle, configuré avec la clé du serveur. */
export const llm = createLlm({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL });

/**
 * Haiku pour tout ce qui s'écrit à chaque partie (conditions de victoire,
 * bilan) : environ vingt fois moins cher que Sonnet, ce qui rend chaque abonné
 * rentable malgré les joueurs gratuits (plan marketing, « Offre, prix et
 * économie »). Réglable par `DRAFT_SHEET_MODEL`.
 */
const COACH_MODEL = env.DRAFT_SHEET_MODEL ?? "claude-haiku-5-5";

/**
 * Sonnet pour le duel : Haiku y prêtait les compétences d'un champion à
 * l'autre. Le duel est gardé par patch et resservi à tous ceux qui le jouent,
 * donc ce modèle plus juste ne coûte qu'une fois par duel (moins d'un
 * centime). Réglable par `MATCHUP_MODEL`.
 */
const MATCHUP_MODEL = env.MATCHUP_MODEL ?? "claude-sonnet-5-5";

export const MODELS = {
  readDraft: "claude-haiku-5-5",
  draftSheet: COACH_MODEL,
  matchup: MATCHUP_MODEL,
  /** Le bilan suit le même réglage que la fiche, pour comparer les modèles d'un coup. */
  matchReview: COACH_MODEL,
} as const;

export { LlmError, type LlmErrorKind } from "./errors";
