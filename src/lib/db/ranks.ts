import "server-only";
import { and, desc, eq } from "drizzle-orm";

import { db } from "./client";
import { rankSnapshots, riotAccounts, type RankSnapshot } from "./schema";

/**
 * Relevés du classement officiel. Riot ne garde pas d'historique : on en prend
 * un à chaque synchronisation. Aucun calcul de niveau caché ici, seulement ce
 * que Riot publie.
 */

export type RankEntry = {
  queue: string;
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
};

const ownedAccount = (userId: string, accountId: string) =>
  and(eq(riotAccounts.id, accountId), eq(riotAccounts.userId, userId));

/** Renvoie `false` si le compte n'appartient pas à l'utilisateur. */
export async function recordRanks(
  userId: string,
  accountId: string,
  entries: RankEntry[],
): Promise<boolean> {
  const [account] = await db
    .select({ id: riotAccounts.id })
    .from(riotAccounts)
    .where(ownedAccount(userId, accountId))
    .limit(1);
  if (!account) return false;
  if (entries.length > 0) {
    await db
      .insert(rankSnapshots)
      .values(entries.map((entry) => ({ riotAccountId: account.id, ...entry })));
  }
  return true;
}

/** Dernier relevé de chaque file classée. */
export async function listLatestRanks(userId: string, accountId: string): Promise<RankSnapshot[]> {
  const rows = await db
    .selectDistinctOn([rankSnapshots.queue], { snapshot: rankSnapshots })
    .from(rankSnapshots)
    .innerJoin(riotAccounts, eq(rankSnapshots.riotAccountId, riotAccounts.id))
    .where(ownedAccount(userId, accountId))
    .orderBy(rankSnapshots.queue, desc(rankSnapshots.takenAt));
  return rows.map((row) => row.snapshot);
}

/** Tous les relevés d'une file, du plus ancien au plus récent (au plus `limit`, les plus récents). */
export async function listRankHistory(
  userId: string,
  accountId: string,
  queue: string,
  options: { limit: number },
): Promise<RankSnapshot[]> {
  const rows = await db
    .select({ snapshot: rankSnapshots })
    .from(rankSnapshots)
    .innerJoin(riotAccounts, eq(rankSnapshots.riotAccountId, riotAccounts.id))
    .where(and(ownedAccount(userId, accountId), eq(rankSnapshots.queue, queue)))
    .orderBy(desc(rankSnapshots.takenAt))
    .limit(options.limit);
  return rows.map((row) => row.snapshot).reverse();
}
