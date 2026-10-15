import "server-only";
import { and, count, desc, eq, exists, inArray, sql } from "drizzle-orm";

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

/**
 * Une partie jouée par l'un des comptes de l'utilisateur, avec le compte qui
 * l'a jouée. Renvoie `null` si aucun de ses comptes n'y a participé : on ne
 * montre jamais une partie à quelqu'un qui n'y était pas.
 */
export async function findPlayedMatch(
  userId: string,
  matchId: string,
): Promise<{
  details: unknown;
  timeline: unknown;
  platform: Platform;
  puuid: string;
  accountId: string;
} | null> {
  const [row] = await db
    .select({
      details: matches.details,
      timeline: matches.timeline,
      platform: matches.platform,
      puuid: riotAccounts.puuid,
      accountId: riotAccounts.id,
    })
    .from(participations)
    .innerJoin(matches, eq(participations.matchId, matches.id))
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(and(eq(riotAccounts.userId, userId), eq(matches.id, matchId)))
    .orderBy(desc(riotAccounts.isPrimary))
    .limit(1);
  if (!row?.puuid) return null;
  return {
    details: row.details,
    timeline: row.timeline,
    platform: row.platform,
    puuid: row.puuid,
    accountId: row.accountId,
  };
}

/** File de parties à prendre en compte : toutes les classées, ou une seule. */
export type QueueFilter = "ALL" | "SOLO" | "FLEX";

const queueCondition = (queue: QueueFilter) =>
  queue === "SOLO"
    ? eq(matches.queueId, 420)
    : queue === "FLEX"
      ? eq(matches.queueId, 440)
      : inArray(matches.queueId, [420, 440]);

/** Totaux d'un groupe de parties, à partir desquels l'interface calcule moyennes et taux. */
const totals = {
  games: sql<number>`count(*)::int`,
  wins: sql<number>`count(*) filter (where ${participations.win})::int`,
  kills: sql<number>`sum(${participations.kills})::int`,
  deaths: sql<number>`sum(${participations.deaths})::int`,
  assists: sql<number>`sum(${participations.assists})::int`,
  cs: sql<number>`sum(${participations.cs})::int`,
  damage: sql<number>`sum(${participations.damageToChampions})::bigint::float8`,
  vision: sql<number>`sum(${participations.visionScore})::int`,
  killParticipation: sql<number>`avg(${participations.killParticipation})::float8`,
  seconds: sql<number>`sum(${matches.durationSeconds})::int`,
};

export type PerformanceTotals = {
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  damage: number;
  vision: number;
  killParticipation: number;
  seconds: number;
};

/** Performances par champion, du plus joué au moins joué. */
export async function listChampionStats(
  userId: string,
  accountId: string,
  queue: QueueFilter,
): Promise<(PerformanceTotals & { championName: string })[]> {
  return db
    .select({ championName: participations.championName, ...totals })
    .from(participations)
    .innerJoin(matches, eq(participations.matchId, matches.id))
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(and(ownedAccount(userId, accountId), queueCondition(queue)))
    .groupBy(participations.championName)
    .orderBy(desc(count()), participations.championName);
}

/** Performances par rôle (les parties sans poste attribué par Riot sont à part, rôle `null`). */
export async function listRoleStats(
  userId: string,
  accountId: string,
  queue: QueueFilter,
): Promise<(PerformanceTotals & { role: PlayedMatch["role"] })[]> {
  return db
    .select({ role: participations.role, ...totals })
    .from(participations)
    .innerJoin(matches, eq(participations.matchId, matches.id))
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(and(ownedAccount(userId, accountId), queueCondition(queue)))
    .groupBy(participations.role)
    .orderBy(desc(count()));
}

/** Bilan contre chaque champion adverse rencontré au même poste. */
export async function listMatchups(
  userId: string,
  accountId: string,
  queue: QueueFilter,
): Promise<{ opponent: string; games: number; wins: number }[]> {
  const opponent = sql<string>`${participations.stats}->>'opponentChampion'`;
  return db
    .select({
      opponent,
      games: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where ${participations.win})::int`,
    })
    .from(participations)
    .innerJoin(matches, eq(participations.matchId, matches.id))
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(
      and(ownedAccount(userId, accountId), queueCondition(queue), sql`${opponent} is not null`),
    )
    .groupBy(opponent)
    .orderBy(desc(count()));
}

/**
 * Enregistre la chronologie (réduite) d'une partie. La partie est partagée,
 * mais seul un utilisateur dont un compte l'a jouée peut l'écrire : renvoie
 * `false` sinon.
 */
export async function saveMatchTimeline(
  userId: string,
  matchId: string,
  timeline: unknown,
): Promise<boolean> {
  const played = db
    .select({ id: participations.id })
    .from(participations)
    .innerJoin(riotAccounts, eq(participations.riotAccountId, riotAccounts.id))
    .where(and(eq(riotAccounts.userId, userId), eq(participations.matchId, matchId)));
  const updated = await db
    .update(matches)
    .set({ timeline })
    .where(and(eq(matches.id, matchId), exists(played)))
    .returning({ id: matches.id });
  return updated.length > 0;
}
