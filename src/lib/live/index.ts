import "server-only";

import type { Platform } from "@/lib/config";
import { riotApi } from "@/lib/riot";
import { RiotApiError } from "@/lib/riot/errors";
import type { LeagueEntryDto } from "@/lib/riot/schemas";
import { buildLiveGame, type LiveGame } from "@/lib/stats/live-game";

/**
 * La partie en cours d'un joueur, avec le classement des dix participants.
 * Renvoie `null` s'il n'est pas en partie. Si Riot limite les appels pendant
 * la lecture des classements, la partie s'affiche quand même, sans ceux qui
 * manquent.
 */
export async function loadLiveGame(platform: Platform, puuid: string): Promise<LiveGame | null> {
  const game = await riotApi.getActiveGame(platform, puuid);
  if (!game) return null;

  const players = game.participants.flatMap((participant) =>
    participant.puuid && !participant.bot ? [participant.puuid] : [],
  );
  const results = await Promise.allSettled(
    players.map(async (playerPuuid) => {
      const entries = await riotApi.getLeagueEntries(platform, playerPuuid);
      return [playerPuuid, entries] as const;
    }),
  );
  const ranks = new Map<string, LeagueEntryDto[]>();
  for (const result of results) {
    if (result.status === "fulfilled") ranks.set(result.value[0], result.value[1]);
    else if (!(result.reason instanceof RiotApiError)) throw result.reason;
  }
  return buildLiveGame(game, puuid, ranks);
}
