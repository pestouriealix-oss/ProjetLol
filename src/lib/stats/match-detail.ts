import { ROLES, type Role } from "@/lib/config";
import {
  matchDetailSchema,
  type MatchDetailDto,
  type MatchDetailParticipantDto,
} from "@/lib/riot/schemas";

import { kdaRatio, roleFromPosition } from "./participation";

/**
 * Le détail d'une partie, tel que la page l'affiche : deux équipes de cinq,
 * l'équipe du joueur en premier, chaque équipe rangée par poste. Fonctions
 * pures, testées sans base ni réseau.
 */

export type DetailPlayer = {
  puuid: string;
  isMe: boolean;
  championName: string;
  role: Role | null;
  /** Riot ID du joueur, quand Riot le fournit (les très anciennes parties n'en ont pas). */
  riotId: { gameName: string; tagLine: string } | null;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  /** Part des éliminations de l'équipe auxquelles le joueur a pris part, de 0 à 1. */
  killParticipation: number;
  cs: number;
  csPerMinute: number;
  gold: number;
  damage: number;
  /** Part des dégâts aux champions de l'équipe, de 0 à 1. */
  damageShare: number;
  damageTaken: number;
  vision: number;
  wardsPlaced: number;
  /** Pinks posées. */
  controlWards: number;
  /** Pinks achetées. */
  controlWardsBought: number;
  /** Les six emplacements d'objets, dans l'ordre (0 pour un emplacement vide). */
  items: number[];
  /** Le bijou (emplacement 7), 0 s'il n'y en a pas. */
  trinket: number;
  /** Les deux sorts d'invocateur (identifiants numériques de Riot). */
  spells: [number, number];
  /** Rune clé et arbre secondaire, quand Riot les fournit. */
  keystone: number | null;
  secondaryStyle: number | null;
};

export type DetailObjectives = {
  towers: number;
  inhibitors: number;
  dragons: number;
  barons: number;
  heralds: number;
  grubs: number;
  atakhan: number;
};

export type DetailTeam = {
  teamId: number;
  side: "BLUE" | "RED";
  isMine: boolean;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  damage: number;
  objectives: DetailObjectives;
  players: DetailPlayer[];
};

export type MatchDetail = {
  id: string;
  queueId: number;
  startedAt: Date;
  durationSeconds: number;
  /** Version du jeu réduite à « majeur.mineur ». */
  patch: string;
  /** Équipe du joueur, puis l'équipe adverse. */
  teams: [DetailTeam, DetailTeam];
  /** Le joueur suivi. */
  me: DetailPlayer;
  /** Plus gros total de dégâts de la partie : l'échelle commune des barres. */
  maxDamage: number;
};

const roleOrder = (role: Role | null) => (role ? ROLES.indexOf(role) : ROLES.length);

function player(
  participant: MatchDetailParticipantDto,
  team: { kills: number; damage: number },
  minutes: number,
  myPuuid: string,
): DetailPlayer {
  const p = participant;
  const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
  const [primary, secondary] = p.perks?.styles ?? [];
  return {
    puuid: p.puuid,
    isMe: p.puuid === myPuuid,
    championName: p.championName,
    role: roleFromPosition(p.teamPosition),
    riotId: p.riotIdGameName
      ? { gameName: p.riotIdGameName, tagLine: p.riotIdTagline ?? "" }
      : null,
    level: p.champLevel,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: kdaRatio(p.kills, p.deaths, p.assists),
    killParticipation: team.kills > 0 ? (p.kills + p.assists) / team.kills : 0,
    cs,
    csPerMinute: minutes > 0 ? cs / minutes : 0,
    gold: p.goldEarned,
    damage: p.totalDamageDealtToChampions,
    damageShare: team.damage > 0 ? p.totalDamageDealtToChampions / team.damage : 0,
    damageTaken: p.totalDamageTaken,
    vision: p.visionScore,
    wardsPlaced: p.wardsPlaced,
    controlWards: p.detectorWardsPlaced,
    controlWardsBought: p.visionWardsBoughtInGame,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
    trinket: p.item6,
    spells: [p.summoner1Id, p.summoner2Id],
    keystone: primary?.selections[0]?.perk ?? null,
    secondaryStyle: secondary?.style ?? null,
  };
}

const sum = (list: MatchDetailParticipantDto[], pick: (p: MatchDetailParticipantDto) => number) =>
  list.reduce((total, participant) => total + pick(participant), 0);

function team(
  match: MatchDetailDto,
  teamId: number,
  myTeamId: number,
  myPuuid: string,
): DetailTeam {
  const { info } = match;
  const members = info.participants.filter((participant) => participant.teamId === teamId);
  const kills = sum(members, (p) => p.kills);
  const damage = sum(members, (p) => p.totalDamageDealtToChampions);
  const minutes = info.gameDuration / 60;
  const objectives = info.teams.find((candidate) => candidate.teamId === teamId)?.objectives;
  return {
    teamId,
    side: teamId === 100 ? "BLUE" : "RED",
    isMine: teamId === myTeamId,
    win: members[0]?.win ?? false,
    kills,
    deaths: sum(members, (p) => p.deaths),
    assists: sum(members, (p) => p.assists),
    gold: sum(members, (p) => p.goldEarned),
    damage,
    objectives: {
      towers: objectives?.tower.kills ?? 0,
      inhibitors: objectives?.inhibitor.kills ?? 0,
      dragons: objectives?.dragon.kills ?? 0,
      barons: objectives?.baron.kills ?? 0,
      heralds: objectives?.riftHerald.kills ?? 0,
      grubs: objectives?.horde.kills ?? 0,
      atakhan: objectives?.atakhan.kills ?? 0,
    },
    players: members
      .map((participant) => player(participant, { kills, damage }, minutes, myPuuid))
      .sort((a, b) => roleOrder(a.role) - roleOrder(b.role)),
  };
}

/**
 * Lit une partie stockée et la met en forme pour le joueur `puuid`. Renvoie
 * `null` si la partie est illisible ou si ce joueur n'y figure pas.
 */
export function buildMatchDetail(details: unknown, puuid: string): MatchDetail | null {
  const parsed = matchDetailSchema.safeParse(details);
  if (!parsed.success) return null;
  const match = parsed.data;
  const { info } = match;

  const mine = info.participants.find((participant) => participant.puuid === puuid);
  if (!mine) return null;
  const otherTeamId =
    info.participants.find((participant) => participant.teamId !== mine.teamId)?.teamId ??
    (mine.teamId === 100 ? 200 : 100);

  const ours = team(match, mine.teamId, mine.teamId, puuid);
  const theirs = team(match, otherTeamId, mine.teamId, puuid);
  const me = ours.players.find((candidate) => candidate.isMe);
  if (!me) return null;

  const [major = "0", minor = "0"] = info.gameVersion.split(".");
  return {
    id: match.metadata.matchId,
    queueId: info.queueId,
    startedAt: new Date(info.gameStartTimestamp ?? info.gameCreation),
    durationSeconds: Math.round(info.gameDuration),
    patch: `${major}.${minor}`,
    teams: [ours, theirs],
    me,
    maxDamage: Math.max(1, ...[...ours.players, ...theirs.players].map((p) => p.damage)),
  };
}
