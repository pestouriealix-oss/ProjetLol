import type { ActiveGameDto, LeagueEntryDto } from "@/lib/riot/schemas";

/**
 * La partie en cours, telle que la page l'affiche : l'équipe du joueur en
 * premier, et le classement officiel de chacun dans la file jouée. Fonctions
 * pures, testées sans réseau.
 */

export type LiveRank = {
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
};

export type LivePlayer = {
  puuid: string | null;
  isMe: boolean;
  championKey: number;
  /** « Pseudo#TAG » tel que Riot le donne, découpé ; `null` pour un bot ou un joueur masqué. */
  riotId: { gameName: string; tagLine: string } | null;
  spells: [number, number];
  keystone: number | null;
  secondaryStyle: number | null;
  /** Classement dans la file de la partie (Solo/Duo par défaut), s'il existe. */
  rank: LiveRank | null;
};

export type LiveTeam = {
  teamId: number;
  side: "BLUE" | "RED";
  isMine: boolean;
  players: LivePlayer[];
  bans: number[];
};

export type LiveGame = {
  gameId: number;
  queueId: number;
  /** Début de la partie, ou `null` pendant l'écran de chargement. */
  startedAt: Date | null;
  teams: [LiveTeam, LiveTeam];
};

/** La file classée dont on affiche le rang : Flex pour une partie Flex, Solo/Duo sinon. */
export function rankQueueFor(queueId: number): "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" {
  return queueId === 440 ? "RANKED_FLEX_SR" : "RANKED_SOLO_5x5";
}

function splitRiotId(riotId: string | undefined): LivePlayer["riotId"] {
  if (!riotId) return null;
  const at = riotId.lastIndexOf("#");
  return at === -1
    ? { gameName: riotId, tagLine: "" }
    : { gameName: riotId.slice(0, at), tagLine: riotId.slice(at + 1) };
}

export function buildLiveGame(
  game: ActiveGameDto,
  myPuuid: string,
  ranks: Map<string, LeagueEntryDto[]>,
): LiveGame {
  const queue = rankQueueFor(game.gameQueueConfigId);
  const me = game.participants.find((participant) => participant.puuid === myPuuid);
  const myTeamId = me?.teamId ?? 100;

  const team = (teamId: number): LiveTeam => ({
    teamId,
    side: teamId === 100 ? "BLUE" : "RED",
    isMine: teamId === myTeamId,
    bans: game.bannedChampions
      .filter((ban) => ban.teamId === teamId && ban.championId > 0)
      .map((ban) => ban.championId),
    players: game.participants
      .filter((participant) => participant.teamId === teamId)
      .map((participant) => {
        const entry = participant.puuid
          ? ranks.get(participant.puuid)?.find((candidate) => candidate.queueType === queue)
          : undefined;
        return {
          puuid: participant.puuid,
          isMe: participant.puuid === myPuuid,
          championKey: participant.championId,
          riotId: participant.bot ? null : splitRiotId(participant.riotId),
          spells: [participant.spell1Id, participant.spell2Id],
          keystone: participant.perks?.perkIds[0] ?? null,
          secondaryStyle: participant.perks?.perkSubStyle ?? null,
          rank: entry
            ? {
                tier: entry.tier,
                division: entry.rank,
                lp: entry.leaguePoints,
                wins: entry.wins,
                losses: entry.losses,
              }
            : null,
        };
      }),
  });

  const otherTeamId = myTeamId === 100 ? 200 : 100;
  return {
    gameId: game.gameId,
    queueId: game.gameQueueConfigId,
    startedAt: game.gameStartTime > 0 ? new Date(game.gameStartTime) : null,
    teams: [team(myTeamId), team(otherTeamId)],
  };
}
