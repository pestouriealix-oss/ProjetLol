import "server-only";

import { env } from "@/lib/env";

import { createLlm } from "./client";

/** Le modèle, configuré avec la clé du serveur. */
export const llm = createLlm({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL });

/**
 * Haiku partout par défaut : environ vingt fois moins cher que Sonnet, ce qui
 * rend chaque abonné rentable malgré les joueurs gratuits (plan marketing,
 * « Offre, prix et économie »). Sonnet ne revient que si Haiku déçoit
 * vraiment, par `DRAFT_SHEET_MODEL`.
 */
const COACH_MODEL = env.DRAFT_SHEET_MODEL ?? "claude-haiku-5-5";

export const MODELS = {
  readDraft: "claude-haiku-5-5",
  draftSheet: COACH_MODEL,
  /** Le bilan suit le même réglage que la fiche, pour comparer les modèles d'un coup. */
  matchReview: COACH_MODEL,
} as const;

export { LlmError, type LlmErrorKind } from "./errors";
