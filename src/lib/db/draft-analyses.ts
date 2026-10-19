import "server-only";
import { and, count, desc, eq, gte } from "drizzle-orm";

import type { Role } from "@/lib/config";

import { db } from "./client";
import { draftAnalyses, riotAccounts } from "./schema";

/**
 * Fiches de draft écrites par le coach. Chaque fiche appartient à un seul
 * utilisateur : toutes les fonctions filtrent par `userId`.
 */

export type NewDraftAnalysis = {
  /** Compte Riot concerné, s'il est connu (ignoré s'il n'appartient pas à l'utilisateur). */
  riotAccountId: string | null;
  patch: string;
  myChampion: string;
  myRole: Role;
  allies: unknown;
  enemies: unknown;
  content: unknown;
  promptVersion: string;
};

export type StoredDraftAnalysis = typeof draftAnalyses.$inferSelect;

/** Nombre de fiches écrites depuis `since` (pour la limite quotidienne de l'offre). */
export async function countDraftAnalysesSince(userId: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(draftAnalyses)
    .where(and(eq(draftAnalyses.userId, userId), gte(draftAnalyses.createdAt, since)));
  return row?.value ?? 0;
}

export async function createDraftAnalysis(
  userId: string,
  analysis: NewDraftAnalysis,
): Promise<string> {
  let riotAccountId: string | null = null;
  if (analysis.riotAccountId) {
    const [owned] = await db
      .select({ id: riotAccounts.id })
      .from(riotAccounts)
      .where(and(eq(riotAccounts.id, analysis.riotAccountId), eq(riotAccounts.userId, userId)))
      .limit(1);
    riotAccountId = owned?.id ?? null;
  }
  const [row] = await db
    .insert(draftAnalyses)
    .values({ ...analysis, riotAccountId, userId })
    .returning({ id: draftAnalyses.id });
  return row!.id;
}

/** La fiche, si elle appartient à l'utilisateur ; sinon `null`. */
export async function findDraftAnalysis(
  userId: string,
  analysisId: string,
): Promise<StoredDraftAnalysis | null> {
  const [row] = await db
    .select()
    .from(draftAnalyses)
    .where(and(eq(draftAnalyses.id, analysisId), eq(draftAnalyses.userId, userId)))
    .limit(1);
  return row ?? null;
}

/** Dernières fiches de l'utilisateur, de la plus récente à la plus ancienne. */
export async function listDraftAnalyses(
  userId: string,
  options: { limit: number },
): Promise<StoredDraftAnalysis[]> {
  return db
    .select()
    .from(draftAnalyses)
    .where(eq(draftAnalyses.userId, userId))
    .orderBy(desc(draftAnalyses.createdAt))
    .limit(options.limit);
}
