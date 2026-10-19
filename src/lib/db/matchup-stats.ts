import "server-only";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";

import type { Platform, Role } from "@/lib/config";
import type { MatchSample } from "@/lib/stats/matchups";

import { db } from "./client";
import { championRoleStats, matchupStats, statMatches } from "./schema";

/**
 * Statistiques de matchups, communes à tous les utilisateurs : uniquement des
 * compteurs par patch et par champion, et l'identifiant des parties lues (pour
 * ne jamais compter une partie deux fois). Aucune donnée personnelle ici.
 */

/** Parmi ces identifiants, ceux déjà comptés. */
export async function knownStatMatches(ids: readonly string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await db
    .select({ id: statMatches.id })
    .from(statMatches)
    .where(inArray(statMatches.id, [...ids]));
  return new Set(rows.map((row) => row.id));
}

/**
 * Ajoute une partie aux statistiques, en une transaction. Renvoie `false` si
 * elle était déjà comptée (rien n'est alors modifié).
 */
export async function recordStatMatch(
  matchId: string,
  platform: Platform,
  sample: MatchSample,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(statMatches)
      .values({ id: matchId, platform, patch: sample.patch })
      .onConflictDoNothing()
      .returning({ id: statMatches.id });
    if (inserted.length === 0) return false;

    for (const row of sample.roles) {
      await tx
        .insert(championRoleStats)
        .values({
          patch: sample.patch,
          role: row.role,
          champion: row.champion,
          games: 1,
          wins: row.win ? 1 : 0,
        })
        .onConflictDoUpdate({
          target: [championRoleStats.patch, championRoleStats.role, championRoleStats.champion],
          set: {
            games: sql`${championRoleStats.games} + 1`,
            wins: sql`${championRoleStats.wins} + ${row.win ? 1 : 0}`,
          },
        });
    }
    for (const row of sample.matchups) {
      await tx
        .insert(matchupStats)
        .values({
          patch: sample.patch,
          role: row.role,
          champion: row.champion,
          opponent: row.opponent,
          games: 1,
          wins: row.win ? 1 : 0,
        })
        .onConflictDoUpdate({
          target: [
            matchupStats.patch,
            matchupStats.role,
            matchupStats.champion,
            matchupStats.opponent,
          ],
          set: {
            games: sql`${matchupStats.games} + 1`,
            wins: sql`${matchupStats.wins} + ${row.win ? 1 : 0}`,
          },
        });
    }
    return true;
  });
}

/** Les patchs couverts, du plus récent au plus ancien, avec leur nombre de parties. */
export async function listStatPatches(): Promise<{ patch: string; matches: number }[]> {
  const rows = await db
    .select({ patch: statMatches.patch, matches: count() })
    .from(statMatches)
    .groupBy(statMatches.patch);
  const value = (patch: string) => patch.split(".").map(Number);
  return rows.sort((a, b) => {
    const [aMajor = 0, aMinor = 0] = value(a.patch);
    const [bMajor = 0, bMinor = 0] = value(b.patch);
    return bMajor - aMajor || bMinor - aMinor;
  });
}

/** Le duel d'un champion contre un autre à un poste, sur un patch. */
export async function findMatchupStat(
  patch: string,
  role: Role,
  champion: number,
  opponent: number,
): Promise<{ games: number; wins: number } | null> {
  const [row] = await db
    .select({ games: matchupStats.games, wins: matchupStats.wins })
    .from(matchupStats)
    .where(
      and(
        eq(matchupStats.patch, patch),
        eq(matchupStats.role, role),
        eq(matchupStats.champion, champion),
        eq(matchupStats.opponent, opponent),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Parties et victoires de ces champions, poste par poste, sur un patch. */
export async function listChampionRoleStats(
  patch: string,
  champions: readonly number[],
): Promise<{ role: Role; champion: number; games: number; wins: number }[]> {
  if (champions.length === 0) return [];
  return db
    .select({
      role: championRoleStats.role,
      champion: championRoleStats.champion,
      games: championRoleStats.games,
      wins: championRoleStats.wins,
    })
    .from(championRoleStats)
    .where(
      and(eq(championRoleStats.patch, patch), inArray(championRoleStats.champion, [...champions])),
    )
    .orderBy(desc(championRoleStats.games));
}

/** Tous les compteurs par poste d'un patch (quelques centaines de lignes). */
export async function listAllChampionRoleStats(
  patch: string,
): Promise<{ role: Role; champion: number; games: number }[]> {
  return db
    .select({
      role: championRoleStats.role,
      champion: championRoleStats.champion,
      games: championRoleStats.games,
    })
    .from(championRoleStats)
    .where(eq(championRoleStats.patch, patch));
}
