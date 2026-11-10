import type { Platform, Role } from "@/lib/config";
import type { ChampionRecord, PlayedMatch } from "@/lib/db/matches";
import type { RiotApi } from "@/lib/riot/api";
import { RiotApiError, type RiotErrorKind } from "@/lib/riot/errors";
import type { LeagueEntryDto, MatchDto } from "@/lib/riot/schemas";
import {
  extractParticipation,
  gameQueue,
  summarizeMatch,
  type MatchSummary,
} from "@/lib/stats/participation";
import type { RiotId } from "@/lib/validation/riot";

/**
 * Le profil public d'un joueur, lu chez Riot à la demande : classement,
 * dernières parties sur la Faille, champions et postes les plus joués.
 *
 * Rien n'est enregistré en base : tout reste quelques minutes en mémoire,
 * pour qu'un profil rouvert (ou un joueur croisé deux fois) ne relance pas
 * une quinzaine d'appels à Riot. Une partie, elle, ne change plus : elle reste
 * en mémoire bien plus longtemps, réduite à ce que le profil affiche.
 */

/** Parties lues pour un profil : assez pour un aperçu, sans vider la limite d'appels de Riot. */
export const PROFILE_MATCHES = 10;
/** Champions listés sur le profil. */
export const PROFILE_CHAMPIONS = 5;
/** Parties demandées à Riot en même temps. */
const CONCURRENCY = 4;

const RANKED_QUEUES = new Set(["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]);

export type ProfileRank = {
  queue: string;
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
};

export type PublicProfile = {
  platform: Platform;
  /** Identifiant Riot du joueur : sert à reconnaître ses propres comptes, jamais affiché. */
  puuid: string;
  /** Le Riot ID tel que Riot l'écrit (majuscules comprises). */
  riotId: RiotId;
  profileIconId: number;
  level: number;
  ranks: ProfileRank[];
  /** Parties sur la Faille, de la plus récente à la plus ancienne. */
  matches: PlayedMatch[];
  champions: ChampionRecord[];
  /** Postes joués, du plus fréquent au moins fréquent. */
  roles: { role: Role; games: number }[];
  /** Vrai si Riot a coupé avant la fin : des parties récentes peuvent manquer. */
  partial: boolean;
  loadedAt: Date;
};

export type ProfileFailure = RiotErrorKind | "too_many";
export type ProfileResult =
  { ok: true; profile: PublicProfile } | { ok: false; reason: ProfileFailure };

type MatchRow = Omit<PlayedMatch, keyof MatchSummaryColumns>;
type MatchSummaryColumns = Pick<
  PlayedMatch,
  "id" | "matchId" | "queueId" | "patch" | "startedAt" | "durationSeconds"
>;
/** Une partie réduite à la ligne de chacun de ses dix joueurs ; `null` hors de la Faille. */
type CompactMatch = { summary: MatchSummary; rows: Map<string, MatchRow> } | null;

/** Réduit une partie à ce que le profil affiche, pour chacun de ses joueurs. */
export function compactMatch(match: MatchDto): CompactMatch {
  if (gameQueue(match.info.queueId) === null) return null;
  const rows = new Map<string, MatchRow>();
  for (const { puuid } of match.info.participants) {
    const played = extractParticipation(match, puuid);
    if (!played) continue;
    rows.set(puuid, {
      championName: played.championName,
      role: played.role,
      win: played.win,
      kills: played.kills,
      deaths: played.deaths,
      assists: played.assists,
      cs: played.cs,
      killParticipation: played.killParticipation,
    });
  }
  return { summary: summarizeMatch(match), rows };
}

const toRank = (entry: LeagueEntryDto): ProfileRank => ({
  queue: entry.queueType,
  tier: entry.tier,
  division: entry.rank,
  lp: entry.leaguePoints,
  wins: entry.wins,
  losses: entry.losses,
});

/** Assemble le profil à partir de ce que Riot a renvoyé. Fonction pure. */
export function buildPublicProfile(input: {
  platform: Platform;
  puuid: string;
  riotId: RiotId;
  profileIconId: number;
  level: number;
  entries: LeagueEntryDto[];
  matches: CompactMatch[];
  partial: boolean;
  loadedAt: Date;
}): PublicProfile {
  const matches: PlayedMatch[] = input.matches
    .flatMap((match) => {
      const row = match?.rows.get(input.puuid);
      if (!match || !row) return [];
      const { summary } = match;
      return [
        {
          id: summary.id,
          matchId: summary.id,
          queueId: summary.queueId,
          patch: summary.patch,
          startedAt: summary.startedAt,
          durationSeconds: summary.durationSeconds,
          ...row,
        },
      ];
    })
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  const byChampion = new Map<string, ChampionRecord>();
  const byRole = new Map<Role, number>();
  for (const match of matches) {
    const record = byChampion.get(match.championName) ?? {
      championName: match.championName,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };
    record.games += 1;
    record.wins += match.win ? 1 : 0;
    record.kills += match.kills;
    record.deaths += match.deaths;
    record.assists += match.assists;
    byChampion.set(match.championName, record);
    if (match.role) byRole.set(match.role, (byRole.get(match.role) ?? 0) + 1);
  }

  return {
    platform: input.platform,
    puuid: input.puuid,
    riotId: input.riotId,
    profileIconId: input.profileIconId,
    level: input.level,
    ranks: input.entries.filter((entry) => RANKED_QUEUES.has(entry.queueType)).map(toRank),
    matches,
    champions: [...byChampion.values()]
      .sort((a, b) => b.games - a.games || b.wins - a.wins)
      .slice(0, PROFILE_CHAMPIONS),
    roles: [...byRole.entries()]
      .map(([role, games]) => ({ role, games }))
      .sort((a, b) => b.games - a.games),
    partial: input.partial,
    loadedAt: input.loadedAt,
  };
}

export type ProfileLoaderOptions = {
  api: Pick<
    RiotApi,
    "getAccountByRiotId" | "getSummoner" | "getLeagueEntries" | "getRecentMatchIds" | "getMatch"
  >;
  /** Durée de vie d'un profil en mémoire, en millisecondes. */
  ttlMs?: number;
  /** Un Riot ID introuvable n'est pas redemandé avant ce délai. */
  notFoundTtlMs?: number;
  maxProfiles?: number;
  maxMatches?: number;
  now?: () => number;
};

/** Ajoute à une Map gardée dans l'ordre d'usage, en chassant les plus anciennes entrées. */
function remember<Key, Value>(map: Map<Key, Value>, key: Key, value: Value, max: number) {
  map.delete(key);
  map.set(key, value);
  while (map.size > max) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

export function createProfileLoader({
  api,
  ttlMs = 5 * 60_000,
  notFoundTtlMs = 60_000,
  maxProfiles = 300,
  maxMatches = 3000,
  now = Date.now,
}: ProfileLoaderOptions) {
  const profiles = new Map<string, { at: number; ttl: number; value: ProfileResult }>();
  const running = new Map<string, Promise<ProfileResult>>();
  const matches = new Map<string, CompactMatch>();

  // Les Riot ID ne tiennent pas compte des majuscules.
  const keyOf = (platform: Platform, { gameName, tagLine }: RiotId) =>
    `${platform}:${gameName.toLowerCase()}#${tagLine.toLowerCase()}`;

  const peek = (platform: Platform, riotId: RiotId): ProfileResult | null => {
    const cached = profiles.get(keyOf(platform, riotId));
    return cached && now() - cached.at < cached.ttl ? cached.value : null;
  };

  const readMatch = async (platform: Platform, matchId: string): Promise<CompactMatch> => {
    if (matches.has(matchId)) {
      const known = matches.get(matchId) ?? null;
      remember(matches, matchId, known, maxMatches);
      return known;
    }
    const compact = compactMatch(await api.getMatch(platform, matchId));
    remember(matches, matchId, compact, maxMatches);
    return compact;
  };

  /** Les parties, par petits groupes ; si Riot limite les appels, on garde ce qui est lu. */
  const readMatches = async (platform: Platform, ids: string[]) => {
    const found: CompactMatch[] = [];
    let partial = false;
    for (let start = 0; start < ids.length; start += CONCURRENCY) {
      const batch = ids.slice(start, start + CONCURRENCY);
      const results = await Promise.allSettled(batch.map((id) => readMatch(platform, id)));
      let stop = false;
      for (const result of results) {
        if (result.status === "fulfilled") {
          found.push(result.value);
          continue;
        }
        if (!(result.reason instanceof RiotApiError)) throw result.reason;
        partial = true;
        if (result.reason.kind === "rate_limited" || result.reason.kind === "invalid_key") {
          stop = true;
        }
      }
      if (stop) break;
    }
    return { found, partial };
  };

  const fetchProfile = async (platform: Platform, riotId: RiotId): Promise<ProfileResult> => {
    try {
      const account = await api.getAccountByRiotId(platform, riotId.gameName, riotId.tagLine);
      const [summoner, entries, ids] = await Promise.all([
        api.getSummoner(platform, account.puuid),
        api.getLeagueEntries(platform, account.puuid),
        api.getRecentMatchIds(platform, account.puuid, PROFILE_MATCHES),
      ]);
      const { found, partial } = await readMatches(platform, ids);
      return {
        ok: true,
        profile: buildPublicProfile({
          platform,
          puuid: account.puuid,
          riotId: { gameName: account.gameName, tagLine: account.tagLine },
          profileIconId: summoner.profileIconId,
          level: summoner.summonerLevel,
          entries,
          matches: found,
          partial,
          loadedAt: new Date(now()),
        }),
      };
    } catch (error) {
      if (error instanceof RiotApiError) return { ok: false, reason: error.kind };
      throw error;
    }
  };

  return {
    /** Le profil s'il est encore frais en mémoire, sans appeler Riot. */
    peek,

    /** Le profil, depuis la mémoire ou chez Riot. Deux demandes simultanées n'en font qu'une. */
    async load(platform: Platform, riotId: RiotId): Promise<ProfileResult> {
      const cached = peek(platform, riotId);
      if (cached) return cached;
      const key = keyOf(platform, riotId);
      const pending = running.get(key);
      if (pending) return pending;

      const request = fetchProfile(platform, riotId).then((value) => {
        // Un profil lu en partie (Riot a coupé) est gardé moins longtemps.
        const ttl = value.ok
          ? value.profile.partial
            ? notFoundTtlMs
            : ttlMs
          : value.reason === "not_found"
            ? notFoundTtlMs
            : 0;
        if (ttl > 0) remember(profiles, key, { at: now(), ttl, value }, maxProfiles);
        return value;
      });
      running.set(key, request);
      try {
        return await request;
      } finally {
        running.delete(key);
      }
    },
  };
}

export type ProfileLoader = ReturnType<typeof createProfileLoader>;
