import type { Role } from "@/lib/config";
import type { MatchDto, MatchParticipantDto } from "@/lib/riot/schemas";

/**
 * Ce qu'on retient d'une partie brute de Riot : son résumé, et la performance
 * d'un joueur donné. Fonctions pures.
 */

export const RANKED_QUEUES = { 420: "SOLO", 440: "FLEX" } as const;
export type RankedQueue = (typeof RANKED_QUEUES)[keyof typeof RANKED_QUEUES];

export function rankedQueue(queueId: number): RankedQueue | null {
  return queueId === 420 ? "SOLO" : queueId === 440 ? "FLEX" : null;
}

const POSITIONS: Record<string, Role> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MID",
  BOTTOM: "ADC",
  UTILITY: "SUPPORT",
};

export type MatchSummary = {
  id: string;
  /** Version technique du jeu, réduite à « majeur.mineur » (par exemple « 16.20 »). */
  patch: string;
  queueId: number;
  startedAt: Date;
  durationSeconds: number;
};

export function summarizeMatch(match: MatchDto): MatchSummary {
  const { info } = match;
  const [major = "0", minor = "0"] = info.gameVersion.split(".");
  return {
    id: match.metadata.matchId,
    patch: `${major}.${minor}`,
    queueId: info.queueId,
    startedAt: new Date(info.gameStartTimestamp ?? info.gameCreation),
    durationSeconds: Math.round(info.gameDuration),
  };
}

export type ParticipationStats = {
  level: number;
  /** Éliminations de toute l'équipe, pour situer la participation du joueur. */
  teamKills: number;
  /** Objets en fin de partie (identifiants Riot, sans les emplacements vides). */
  items: number[];
  /** Champion adverse au même poste, quand Riot a pu attribuer les postes. */
  opponentChampion: string | null;
};

export type ParticipationData = {
  championId: number;
  championName: string;
  role: Role | null;
  side: "BLUE" | "RED";
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  damageToChampions: number;
  visionScore: number;
  /** Part des éliminations de l'équipe auxquelles le joueur a pris part, de 0 à 1. */
  killParticipation: number;
  stats: ParticipationStats;
};

function items(participant: MatchParticipantDto): number[] {
  const raw = participant as Record<string, unknown>;
  return [0, 1, 2, 3, 4, 5, 6]
    .map((slot) => raw[`item${slot}`])
    .filter((item): item is number => typeof item === "number" && item > 0);
}

/** Renvoie `null` si le joueur n'a pas participé à cette partie. */
export function extractParticipation(match: MatchDto, puuid: string): ParticipationData | null {
  const { participants } = match.info;
  const player = participants.find((participant) => participant.puuid === puuid);
  if (!player) return null;

  const team = participants.filter((participant) => participant.teamId === player.teamId);
  const teamKills = team.reduce((total, participant) => total + participant.kills, 0);
  const opponent = player.teamPosition
    ? participants.find(
        (participant) =>
          participant.teamId !== player.teamId && participant.teamPosition === player.teamPosition,
      )
    : undefined;

  return {
    championId: player.championId,
    championName: player.championName,
    role: POSITIONS[player.teamPosition] ?? null,
    side: player.teamId === 100 ? "BLUE" : "RED",
    win: player.win,
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    cs: player.totalMinionsKilled + player.neutralMinionsKilled,
    gold: player.goldEarned,
    damageToChampions: player.totalDamageDealtToChampions,
    visionScore: player.visionScore,
    killParticipation: teamKills > 0 ? (player.kills + player.assists) / teamKills : 0,
    stats: {
      level: player.champLevel,
      teamKills,
      items: items(player),
      opponentChampion: opponent?.championName ?? null,
    },
  };
}

/** (Éliminations + assistances) / morts ; sans mort, le total lui-même. */
export function kdaRatio(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(1, deaths);
}
