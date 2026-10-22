import "server-only";
import { and, count, desc, eq, gte } from "drizzle-orm";

import { db } from "./client";
import { matchReviews, participations, riotAccounts } from "./schema";

/**
 * Bilans de parties. Un bilan est rattaché à la performance d'un compte Riot
 * dans une partie ; il n'est lu, compté et écrit que pour l'utilisateur à qui
 * ce compte appartient.
 */

export type StoredMatchReview = {
  id: string;
  summary: string;
  focus: string | null;
  strengths: unknown;
  improvements: unknown;
  facts: unknown;
  promptVersion: string;
  createdAt: Date;
};

const reviewColumns = {
  id: matchReviews.id,
  summary: matchReviews.summary,
  focus: matchReviews.focus,
  strengths: matchReviews.strengths,
  improvements: matchReviews.improvements,
  facts: matchReviews.facts,
  promptVersion: matchReviews.promptVersion,
  createdAt: matchReviews.createdAt,
};

/** Le bilan de cette partie pour l'un des comptes de l'utilisateur (le principal d'abord). */
export async function findMatchReview(
  userId: string,
  matchId: string,
): Promise<StoredMatchReview | null> {
  const [row] = await db
    .select(reviewColumns)
    .from(matchReviews)
    .innerJoin(participations, eq(matchReviews.participationId, participations.id))
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(and(eq(riotAccounts.userId, userId), eq(participations.matchId, matchId)))
    .orderBy(desc(riotAccounts.isPrimary))
    .limit(1);
  return row ?? null;
}

/** Bilans écrits pour l'utilisateur depuis `since` (quota quotidien). */
export async function countMatchReviewsSince(userId: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(matchReviews)
    .innerJoin(participations, eq(matchReviews.participationId, participations.id))
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(and(eq(riotAccounts.userId, userId), gte(matchReviews.createdAt, since)));
  return row?.value ?? 0;
}

/**
 * Enregistre le bilan d'une partie que l'un des comptes de l'utilisateur a
 * jouée. Renvoie son identifiant ; `null` si aucun de ses comptes n'y a joué.
 * Si un bilan existait déjà, il est remplacé.
 */
export async function saveMatchReview(
  userId: string,
  matchId: string,
  review: {
    summary: string;
    focus: string;
    strengths: unknown;
    improvements: unknown;
    facts: unknown;
    promptVersion: string;
  },
): Promise<string | null> {
  const [participation] = await db
    .select({ id: participations.id })
    .from(participations)
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(and(eq(riotAccounts.userId, userId), eq(participations.matchId, matchId)))
    .orderBy(desc(riotAccounts.isPrimary))
    .limit(1);
  if (!participation) return null;

  const [row] = await db
    .insert(matchReviews)
    .values({ participationId: participation.id, ...review })
    .onConflictDoUpdate({
      target: matchReviews.participationId,
      set: { ...review, createdAt: new Date() },
    })
    .returning({ id: matchReviews.id });
  return row?.id ?? null;
}
