import "server-only";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";

import type { Platform } from "@/lib/config";
import type { MatchSummary, ParticipationData } from "@/lib/stats/participation";

import { db } from "./client";
import { matches, participations, riotAccounts } from "./schema";

/**
 * Parties et performances. Une partie brute est partagée entre tous les
 * joueurs qui y ont pris part ; une performance appartient à un compte Riot,
 * donc à un utilisateur. Chaque fonction prend `userId` en premier argument et
 * ne touche que les comptes de cet utilisateur.
 */

const ownedAccount = (userId: string, accountId: string) =>
  and(eq(riotAccounts.id, accountId), eq(riotAccounts.userId, userId));

/** Parmi ces parties, celles déjà enregistrées pour ce compte. */
export async function listKnownMatchIds(
  userId: string,
  accountId: string,
  matchIds: string[],
): Promise<string[]> {
  if (matchIds.length === 0) return [];
  const rows = await db
    .select({ matchId: participations.matchId })
    .from(participations)
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(and(ownedAccount(userId, accountId), inArray(participations.matchId, matchIds)));
  return rows.map((row) => row.matchId);
}

/**
 * Enregistre une partie (si elle ne l'est pas déjà) et la performance du
 * compte. Renvoie `false` si le compte n'appartient pas à l'utilisateur, ou si
 * cette performance était déjà enregistrée.
 */
export async function saveMatchForAccount(
  userId: string,
  accountId: string,
  input: {
    platform: Platform;
    summary: MatchSummary;
    details: unknown;
    participation: ParticipationData;
  },
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [account] = await tx
      .select({ id: riotAccounts.id })
      .from(riotAccounts)
      .where(ownedAccount(userId, accountId))
      .limit(1);
    if (!account) return false;

    const { summary } = input;
    await tx
      .insert(matches)
      .values({
        id: summary.id,
        platform: input.platform,
        patch: summary.patch,
        queueId: summary.queueId,
        startedAt: summary.startedAt,
        durationSeconds: summary.durationSeconds,
        details: input.details,
      })
      .onConflictDoNothing();

    const inserted = await tx
      .insert(participations)
      .values({ riotAccountId: account.id, matchId: summary.id, ...input.participation })
      .onConflictDoNothing()
      .returning({ id: participations.id });
    return inserted.length > 0;
  });
}

const playedMatchColumns = {
  id: participations.id,
  matchId: matches.id,
  queueId: matches.queueId,
  patch: matches.patch,
  startedAt: matches.startedAt,
  durationSeconds: matches.durationSeconds,
  championName: participations.championName,
  role: participations.role,
  win: participations.win,
  kills: participations.kills,
  deaths: participations.deaths,
  assists: participations.assists,
  cs: participations.cs,
  killParticipation: participations.killParticipation,
};

export type PlayedMatch = Awaited<ReturnType<typeof listPlayedMatches>>[number];

/** Parties d'un compte, de la plus récente à la plus ancienne. */
export async function listPlayedMatches(
  userId: string,
  accountId: string,
  options: { limit: number },
) {
  return db
    .select(playedMatchColumns)
    .from(participations)
    .innerJoin(matches, eq(participations.matchId, matches.id))
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(ownedAccount(userId, accountId))
    .orderBy(desc(matches.startedAt))
    .limit(options.limit);
}

export type ChampionRecord = {
  championName: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
};

/** Bilan par champion, du plus joué au moins joué. */
export async function listChampionRecords(
  userId: string,
  accountId: string,
  options: { limit: number },
): Promise<ChampionRecord[]> {
  const games = count();
  return db
    .select({
      championName: participations.championName,
      games,
      wins: sql<number>`count(*) filter (where ${participations.win})::int`,
      kills: sql<number>`sum(${participations.kills})::int`,
      deaths: sql<number>`sum(${participations.deaths})::int`,
      assists: sql<number>`sum(${participations.assists})::int`,
    })
    .from(participations)
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(ownedAccount(userId, accountId))
    .groupBy(participations.championName)
    .orderBy(desc(games), participations.championName)
    .limit(options.limit);
}
