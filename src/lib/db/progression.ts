import "server-only";
import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";

import { goalSchema, type PlayedGame, type SetGoal } from "@/lib/stats/goals";

import { db } from "./client";
import { matchReviews, matches, participations, riotAccounts } from "./schema";

/**
 * Ce que la page Progression lit : les objectifs fixés par les bilans d'un
 * compte, et ses parties avec les chiffres qui servent à les vérifier. Chaque
 * fonction prend `userId` en premier argument et ne touche que ses comptes.
 */

const ownedAccount = (userId: string, accountId: string) =>
  and(eq(riotAccounts.id, accountId), eq(riotAccounts.userId, userId));

/**
 * Objectifs chiffrés fixés par les bilans des parties de ce compte, du plus
 * récent au plus ancien. Les bilans d'avant l'objectif chiffré sont ignorés,
 * comme ceux d'une partie sans poste.
 */
export async function listSetGoals(
  userId: string,
  accountId: string,
  options: { limit: number },
): Promise<SetGoal[]> {
  const rows = await db
    .select({
      reviewId: matchReviews.id,
      matchId: participations.matchId,
      role: participations.role,
      championName: participations.championName,
      goal: matchReviews.goal,
      text: matchReviews.focus,
      setAt: matchReviews.createdAt,
    })
    .from(matchReviews)
    .innerJoin(participations, eq(matchReviews.participationId, participations.id))
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(and(ownedAccount(userId, accountId), isNotNull(matchReviews.goal)))
    .orderBy(desc(matchReviews.createdAt))
    .limit(options.limit);

  return rows.flatMap((row) => {
    const goal = goalSchema.safeParse(row.goal);
    if (!goal.success || !row.role) return [];
    return [
      {
        ...goal.data,
        reviewId: row.reviewId,
        matchId: row.matchId,
        role: row.role,
        championName: row.championName,
        text: row.text,
        setAt: row.setAt,
      },
    ];
  });
}

/**
 * Pinks achetées par le joueur, lues dans la partie brute (elles ne sont pas
 * dans la performance enregistrée) ; `null` si Riot ne les donne pas.
 */
const controlWards = sql<number | null>`(
  select (participant->>'visionWardsBoughtInGame')::int
  from jsonb_array_elements(${matches.details}->'info'->'participants') as participant
  where participant->>'puuid' = ${riotAccounts.puuid}
  limit 1
)`;

/**
 * Parties d'un compte avec les chiffres des indicateurs, de la plus récente à
 * la plus ancienne ; seulement celles commencées après `since` s'il est donné.
 */
export async function listPlayedGames(
  userId: string,
  accountId: string,
  options: { limit: number; since?: Date },
): Promise<PlayedGame[]> {
  const rows = await db
    .select({
      matchId: matches.id,
      startedAt: matches.startedAt,
      durationSeconds: matches.durationSeconds,
      role: participations.role,
      win: participations.win,
      championName: participations.championName,
      cs: participations.cs,
      deaths: participations.deaths,
      killParticipation: participations.killParticipation,
      visionScore: participations.visionScore,
      damageToChampions: participations.damageToChampions,
      controlWards,
    })
    .from(participations)
    .innerJoin(matches, eq(participations.matchId, matches.id))
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(
      and(
        ownedAccount(userId, accountId),
        options.since ? gt(matches.startedAt, options.since) : undefined,
      ),
    )
    .orderBy(desc(matches.startedAt))
    .limit(options.limit);
  return rows;
}
