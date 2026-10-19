import type { LeagueEntryDto } from "./schemas";

import { RiotApiError } from "./errors";

/**
 * Classements des joueurs gardés en mémoire un moment : rouvrir une partie, ou
 * croiser les mêmes joueurs d'une partie à l'autre, ne relance pas dix appels à
 * Riot. Le classement affiché est celui d'aujourd'hui (Riot ne garde pas celui
 * du jour de la partie).
 */

export type RankCacheOptions = {
  load: (puuid: string) => Promise<LeagueEntryDto[]>;
  /** Durée de vie d'un classement en mémoire, en millisecondes. */
  ttlMs?: number;
  /** Nombre de joueurs gardés au plus ; au-delà, les plus anciens partent. */
  maxEntries?: number;
  now?: () => number;
};

export function createRankCache({
  load,
  ttlMs = 30 * 60 * 1000,
  maxEntries = 5000,
  now = Date.now,
}: RankCacheOptions) {
  const entries = new Map<string, { at: number; value: LeagueEntryDto[] }>();

  const get = async (puuid: string): Promise<LeagueEntryDto[]> => {
    const cached = entries.get(puuid);
    if (cached && now() - cached.at < ttlMs) return cached.value;
    const value = await load(puuid);
    entries.delete(puuid);
    entries.set(puuid, { at: now(), value });
    // Une Map garde l'ordre d'insertion : la première clé est la plus ancienne.
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
    return value;
  };

  return {
    get,
    /**
     * Les classements de plusieurs joueurs. Un joueur que Riot ne renvoie pas
     * (limite d'appels, panne) est simplement absent de la réponse.
     */
    async many(puuids: readonly string[]): Promise<Map<string, LeagueEntryDto[]>> {
      const results = await Promise.allSettled(
        puuids.map(async (puuid) => [puuid, await get(puuid)] as const),
      );
      const found = new Map<string, LeagueEntryDto[]>();
      for (const result of results) {
        if (result.status === "fulfilled") found.set(result.value[0], result.value[1]);
        else if (!(result.reason instanceof RiotApiError)) throw result.reason;
      }
      return found;
    },
  };
}
