import "server-only";

import type { Platform } from "@/lib/config";
import { env } from "@/lib/env";

import { createRiotApi } from "./api";
import { createRiotClient } from "./client";
import { createRankCache } from "./rank-cache";
import type { LeagueEntryDto } from "./schemas";

/** L'API Riot configurée avec la clé du serveur. */
export const riotApi = createRiotApi(
  createRiotClient({ apiKey: env.RIOT_API_KEY, baseUrl: env.RIOT_API_BASE_URL }),
);

const rankCaches = new Map<Platform, ReturnType<typeof createRankCache>>();

/**
 * Classements officiels (League-V4) de plusieurs joueurs d'un même serveur,
 * gardés une demi-heure en mémoire. Un joueur que Riot ne renvoie pas est
 * absent de la réponse.
 */
export function loadPlayerRanks(
  platform: Platform,
  puuids: readonly string[],
): Promise<Map<string, LeagueEntryDto[]>> {
  let cache = rankCaches.get(platform);
  if (!cache) {
    cache = createRankCache({ load: (puuid) => riotApi.getLeagueEntries(platform, puuid) });
    rankCaches.set(platform, cache);
  }
  return cache.many(puuids);
}

export const isRiotApiConfigured = Boolean(env.RIOT_API_KEY);

export { RiotApiError } from "./errors";
