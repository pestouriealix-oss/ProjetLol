import "server-only";

import { env } from "@/lib/env";

import { createLlm } from "./client";

/** Le modèle, configuré avec la clé du serveur. */
export const llm = createLlm({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL });

/**
 * Modèles utilisés : un petit modèle rapide pour lire la capture, un plus
 * capable pour écrire la fiche.
 */
export const MODELS = {
  readDraft: "claude-haiku-5-5",
  draftSheet: "claude-sonnet-5-5",
} as const;

export { LlmError, type LlmErrorKind } from "./errors";
