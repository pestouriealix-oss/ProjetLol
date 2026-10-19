import "server-only";

import type { Platform } from "@/lib/config";
import { loadPlayerRanks, riotApi } from "@/lib/riot";
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
  const ranks = await loadPlayerRanks(platform, players);
  return buildLiveGame(game, puuid, ranks);
}
