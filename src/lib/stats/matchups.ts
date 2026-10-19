import { ROLES, type Role } from "@/lib/config";
import type { MatchDto } from "@/lib/riot/schemas";

import { roleFromPosition } from "./participation";

/**
 * Statistiques de matchups tirées de parties classées : ce qu'on retient d'une
 * partie (qui a affronté qui, à quel poste, et qui a gagné), puis la lecture de
 * ces chiffres. Fonctions pures, sans réseau ni base.
 */

/** File classée Solo/Duo : la seule retenue pour les statistiques. */
export const SOLO_QUEUE_ID = 420;
/** En dessous, la partie a été écourtée (« remake ») : elle ne dit rien du matchup. */
export const MIN_GAME_SECONDS = 15 * 60;
/** En dessous de ce nombre de parties, un taux de victoire n'est pas affiché comme fiable. */
export const MIN_RELIABLE_GAMES = 40;

/** « 16.20.712.3 » → « 16.20 ». */
export function patchOfVersion(version: string): string {
  return version.split(".").slice(0, 2).join(".");
}

export type RoleRow = { role: Role; champion: number; win: boolean };
export type MatchupRow = RoleRow & { opponent: number };

export type MatchSample = {
  patch: string;
  /** Un champion par rôle et par équipe (jusqu'à dix lignes). */
  roles: RoleRow[];
  /** Chaque duel, des deux côtés (jusqu'à dix lignes). */
  matchups: MatchupRow[];
};

/**
 * Ce qu'une partie apporte aux statistiques, ou `null` si elle ne compte pas :
 * autre file que Solo/Duo, partie écourtée, ou postes incomplets.
 */
export function sampleMatch(match: MatchDto): MatchSample | null {
  const { info } = match;
  if (info.queueId !== SOLO_QUEUE_ID || info.gameDuration < MIN_GAME_SECONDS) return null;
  if (info.participants.length !== 10) return null;

  const byTeam = new Map<number, Map<Role, (typeof info.participants)[number]>>();
  for (const participant of info.participants) {
    const role = roleFromPosition(participant.teamPosition);
    if (!role) return null;
    const team = byTeam.get(participant.teamId) ?? new Map();
    if (team.has(role)) return null;
    team.set(role, participant);
    byTeam.set(participant.teamId, team);
  }
  const [blue, red] = [byTeam.get(100), byTeam.get(200)];
  if (!blue || !red || blue.size !== 5 || red.size !== 5) return null;

  const roles: RoleRow[] = [];
  const matchups: MatchupRow[] = [];
  for (const role of ROLES) {
    const a = blue.get(role)!;
    const b = red.get(role)!;
    roles.push({ role, champion: a.championId, win: a.win });
    roles.push({ role, champion: b.championId, win: b.win });
    matchups.push({ role, champion: a.championId, opponent: b.championId, win: a.win });
    matchups.push({ role, champion: b.championId, opponent: a.championId, win: b.win });
  }
  return { patch: patchOfVersion(info.gameVersion), roles, matchups };
}

export type WinRate = {
  games: number;
  wins: number;
  /** Entre 0 et 1. */
  rate: number;
  /** Assez de parties pour que le chiffre veuille dire quelque chose. */
  reliable: boolean;
};

export function winRate(games: number, wins: number): WinRate {
  return {
    games,
    wins,
    rate: games > 0 ? wins / games : 0,
    reliable: games >= MIN_RELIABLE_GAMES,
  };
}

/**
 * Le rôle de chaque champion d'une équipe dont on ne connaît que les choix
 * (partie en cours) : la répartition la plus probable, d'après la part de
 * parties jouées à chaque poste, avec le Châtiment pour le jungler.
 */
export function assignTeamRoles(
  picks: readonly { champion: number; smite: boolean }[],
  /** Probabilité (0 à 1) qu'un champion soit joué à un poste, ou `undefined` si inconnue. */
  likelihood: (champion: number, role: Role) => number | undefined,
): Map<number, Role> {
  const team = picks.slice(0, 5);
  const score = (pick: (typeof team)[number], role: Role) => {
    // Le Châtiment est presque une preuve : il l'emporte sur toute habitude.
    if (pick.smite) return role === "JUNGLE" ? 1 : 1e-6;
    const known = likelihood(pick.champion, role);
    // Sans donnée, tous les postes se valent, sauf la jungle (pas de Châtiment).
    const base = known ?? (role === "JUNGLE" ? 0.02 : 0.25);
    return Math.max(base, 0.001);
  };

  let best: { roles: Role[]; score: number } | null = null;
  const permute = (remaining: Role[], chosen: Role[], product: number) => {
    if (chosen.length === team.length) {
      if (!best || product > best.score) best = { roles: chosen, score: product };
      return;
    }
    const pick = team[chosen.length]!;
    for (const role of remaining) {
      permute(
        remaining.filter((candidate) => candidate !== role),
        [...chosen, role],
        product * score(pick, role),
      );
    }
  };
  permute([...ROLES], [], 1);

  const result = new Map<number, Role>();
  const roles = (best as { roles: Role[] } | null)?.roles ?? [];
  team.forEach((pick, index) => {
    const role = roles[index];
    if (role) result.set(pick.champion, role);
  });
  return result;
}

/** Part de chaque poste dans les parties d'un champion, à partir des compteurs. */
export function roleShares(
  rows: readonly { role: Role; champion: number; games: number }[],
): (champion: number, role: Role) => number | undefined {
  const totals = new Map<number, number>();
  for (const row of rows) totals.set(row.champion, (totals.get(row.champion) ?? 0) + row.games);
  const shares = new Map<string, number>();
  for (const row of rows) {
    const total = totals.get(row.champion) ?? 0;
    if (total > 0) shares.set(`${row.champion}:${row.role}`, row.games / total);
  }
  return (champion, role) => {
    if (!totals.has(champion)) return undefined;
    return shares.get(`${champion}:${role}`) ?? 0;
  };
}
