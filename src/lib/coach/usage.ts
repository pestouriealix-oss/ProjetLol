import "server-only";

import { isPaidPlan } from "@/lib/auth/entitlements";
import type { Plan } from "@/lib/config";
import { recordLlmUsage, siteLlmSpendSince, type LlmCallKind } from "@/lib/db/llm-usages";
import { env } from "@/lib/env";
import type { LlmUsage } from "@/lib/llm/pricing";

/** Enregistre ce qu'a coûté un appel au modèle, sans jamais faire échouer la fiche. */
export function trackUsage(userId: string, kind: LlmCallKind, usage: LlmUsage): void {
  recordLlmUsage(userId, kind, usage).catch((error: unknown) => {
    console.error("Suivi du coût du modèle impossible", error);
  });
}

/**
 * Plafond mensuel de dépense du site (LLM_MONTHLY_BUDGET_USD) : une fois
 * atteint, les fiches gratuites s'arrêtent jusqu'au mois suivant ; les offres
 * payantes continuent. Sans plafond défini, rien n'est bloqué.
 */
export async function freeCoachPaused(plan: Plan, now = new Date()): Promise<boolean> {
  if (isPaidPlan(plan) || env.LLM_MONTHLY_BUDGET_USD === undefined) return false;
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const spentMicroUsd = await siteLlmSpendSince(monthStart);
  return spentMicroUsd >= env.LLM_MONTHLY_BUDGET_USD * 1_000_000;
}
