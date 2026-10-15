import type { Platform } from "@/lib/config";

import type { RiotClient } from "./client";
import {
  leagueEntriesSchema,
  matchIdsSchema,
  matchSchema,
  riotAccountSchema,
  summonerSchema,
  type LeagueEntryDto,
  type MatchDto,
  type RiotAccountDto,
  type SummonerDto,
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

    /** Match-V5 : identifiants des dernières parties classées, de la plus récente à la plus ancienne. */
    getRankedMatchIds(platform: Platform, puuid: string, count: number): Promise<string[]> {
      return client.get(
        { kind: "regional", platform },
        `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`,
        matchIdsSchema,
        { type: "ranked", start: 0, count },
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
