import type { Platform } from "@/lib/config";

import type { RiotClient } from "./client";
import { RiotApiError } from "./errors";
import {
  activeGameSchema,
  apexLeagueSchema,
  ladderEntriesSchema,
  leagueEntriesSchema,
  matchIdsSchema,
  matchSchema,
  riotAccountSchema,
  summonerSchema,
  timelineSchema,
  type ActiveGameDto,
  type LeagueEntryDto,
  type MatchDto,
  type RiotAccountDto,
  type SummonerDto,
  type TimelineDto,
} from "./schemas";

/** Les appels à l'API Riot dont l'application a besoin, et rien d'autre. */
export type RiotApi = ReturnType<typeof createRiotApi>;

export function createRiotApi(client: RiotClient) {
  return {
    /** Account-V1 : retrouve un joueur par son Riot ID. */
    getAccountByRiotId(
      platform: Platform,
      gameName: string,
      tagLine: string,
    ): Promise<RiotAccountDto> {
      return client.get(
        { kind: "account", platform },
        `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        riotAccountSchema,
      );
    },

    /** Spectator-V5 : la partie que le joueur est en train de jouer, ou `null`. */
    async getActiveGame(platform: Platform, puuid: string): Promise<ActiveGameDto | null> {
      try {
        return await client.get(
          { kind: "platform", platform },
          `/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`,
          activeGameSchema,
        );
      } catch (error) {
        // Riot répond « introuvable » quand le joueur n'est pas en partie.
        if (error instanceof RiotApiError && error.kind === "not_found") return null;
        throw error;
      }
    },

    /** Summoner-V4 : icône d'invocateur et niveau du joueur. */
    getSummoner(platform: Platform, puuid: string): Promise<SummonerDto> {
      return client.get(
        { kind: "platform", platform },
        `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`,
        summonerSchema,
      );
    },

    /** League-V4 : classement officiel du joueur, une entrée par file classée. */
    getLeagueEntries(platform: Platform, puuid: string): Promise<LeagueEntryDto[]> {
      return client.get(
        { kind: "platform", platform },
        `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
        leagueEntriesSchema,
      );
    },

    /** League-V4 : une page de joueurs d'un palier et d'une division (Solo/Duo). */
    getLadderPage(
      platform: Platform,
      tier: "EMERALD" | "DIAMOND",
      division: "I" | "II" | "III" | "IV",
      page: number,
    ): Promise<{ puuid: string }[]> {
      return client.get(
        { kind: "platform", platform },
        `/lol/league/v4/entries/RANKED_SOLO_5x5/${tier}/${division}`,
        ladderEntriesSchema,
        { page },
      );
    },

    /** League-V4 : toute la ligue Maître, Grand Maître ou Challenger (Solo/Duo). */
    async getApexLadder(
      platform: Platform,
      tier: "master" | "grandmaster" | "challenger",
    ): Promise<{ puuid: string }[]> {
      const league = await client.get(
        { kind: "platform", platform },
        `/lol/league/v4/${tier}leagues/by-queue/RANKED_SOLO_5x5`,
        apexLeagueSchema,
      );
      return league.entries;
    },

    /** Match-V5 : dernières parties Solo/Duo d'un joueur depuis une date (secondes). */
    getSoloMatchIds(
      platform: Platform,
      puuid: string,
      options: { count: number; startTime: number },
    ): Promise<string[]> {
      return client.get(
        { kind: "regional", platform },
        `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`,
        matchIdsSchema,
        { queue: 420, start: 0, count: options.count, startTime: options.startTime },
      );
    },

    /** Match-V5 : identifiants des dernières parties classées, de la plus récente à la plus ancienne. */
    getRankedMatchIds(platform: Platform, puuid: string, count: number): Promise<string[]> {
      return client.get(
        { kind: "regional", platform },
        `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`,
        matchIdsSchema,
        { type: "ranked", start: 0, count },
      );
    },

    /** Match-V5 : la chronologie d'une partie (or minute par minute, événements). */
    getMatchTimeline(platform: Platform, matchId: string): Promise<TimelineDto> {
      return client.get(
        { kind: "regional", platform },
        `/lol/match/v5/matches/${encodeURIComponent(matchId)}/timeline`,
        timelineSchema,
      );
    },

    /** Match-V5 : une partie complète. */
    getMatch(platform: Platform, matchId: string): Promise<MatchDto> {
      return client.get(
        { kind: "regional", platform },
        `/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
        matchSchema,
      );
    },
  };
}
