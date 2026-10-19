import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";

import type { LlmUsage } from "@/lib/llm/pricing";
import { costMicroUsd } from "@/lib/llm/pricing";

import { db } from "./client";
import { draftAnalyses, llmUsages } from "./schema";

/**
 * Suivi de ce que coûte le modèle : un enregistrement par appel (tokens et
 * coût estimé). Les données d'un utilisateur ne sont lues que pour lui ; le
 * total de tous les utilisateurs ne sert qu'au plafond de dépense du site.
 */

export type LlmCallKind = (typeof llmUsages.$inferInsert)["kind"];

export async function recordLlmUsage(
  userId: string,
  kind: LlmCallKind,
  usage: LlmUsage,
): Promise<void> {
  await db.insert(llmUsages).values({
    userId,
    kind,
    model: usage.model,
    // Le cache compte dans ce qui est envoyé : il est facturé, moins cher.
    inputTokens: usage.inputTokens + usage.cacheWriteTokens + usage.cacheReadTokens,
    outputTokens: usage.outputTokens,
    costMicroUsd: costMicroUsd(usage),
  });
}

/** Ce que l'utilisateur a consommé depuis `since` : nombre d'appels et coût. */
export async function sumLlmUsage(
  userId: string,
  since: Date,
): Promise<{ calls: number; costMicroUsd: number }> {
  const [row] = await db
    .select({
      calls: sql<number>`count(*)::int`,
      cost: sql<number>`coalesce(sum(${llmUsages.costMicroUsd}), 0)::int`,
    })
    .from(llmUsages)
    .where(and(eq(llmUsages.userId, userId), gte(llmUsages.createdAt, since)));
  return { calls: row?.calls ?? 0, costMicroUsd: row?.cost ?? 0 };
}

/**
 * Dépense totale du site depuis `since`, tous utilisateurs confondus (pour le
 * plafond mensuel). Aucun détail par personne n'en sort.
 */
export async function siteLlmSpendSince(since: Date): Promise<number> {
  const [row] = await db
    .select({ cost: sql<number>`coalesce(sum(${llmUsages.costMicroUsd}), 0)::bigint` })
    .from(llmUsages)
    .where(gte(llmUsages.createdAt, since));
  return Number(row?.cost ?? 0);
}

/**
 * Bilan du site depuis `since`, pour régler les prix : par type d'appel et par
 * modèle, le nombre d'appels et leur coût ; et le nombre de fiches écrites.
 * Uniquement des totaux, aucun détail par personne.
 */
export async function siteLlmCostReport(since: Date): Promise<{
  sheets: number;
  rows: { kind: LlmCallKind; model: string; calls: number; costMicroUsd: number }[];
}> {
  const rows = await db
    .select({
      kind: llmUsages.kind,
      model: llmUsages.model,
      calls: sql<number>`count(*)::int`,
      costMicroUsd: sql<number>`coalesce(sum(${llmUsages.costMicroUsd}), 0)::bigint`,
    })
    .from(llmUsages)
    .where(gte(llmUsages.createdAt, since))
    .groupBy(llmUsages.kind, llmUsages.model);
  const [sheets] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(draftAnalyses)
    .where(gte(draftAnalyses.createdAt, since));
  return {
    sheets: sheets?.value ?? 0,
    rows: rows.map((row) => ({ ...row, costMicroUsd: Number(row.costMicroUsd) })),
  };
}
