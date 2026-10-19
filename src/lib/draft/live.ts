import type { Role } from "@/lib/config";
import type { ActiveGameDto } from "@/lib/riot/schemas";
import { assignTeamRoles } from "@/lib/stats/matchups";

import { emptySide, type Draft, type DraftSide } from "./draft";

/**
 * La draft d'une partie en cours (Spectator-V5), sans capture ni saisie. Riot
 * donne les dix champions et les sorts d'invocateur, pas les postes : ils sont
 * déduits (Châtiment pour le jungler, puis les postes où chaque champion est
 * le plus joué). Fonctions pures, testées à part.
 */

/** Sort d'invocateur Châtiment. */
export const SMITE_ID = 11;

/** Faute de statistiques : poste probable selon les catégories Data Dragon du champion. */
const TAG_ROLES: Record<string, Partial<Record<Role, number>>> = {
  Marksman: { ADC: 0.75, MID: 0.12, TOP: 0.08, SUPPORT: 0.05 },
  Support: { SUPPORT: 0.75, MID: 0.15, TOP: 0.05, ADC: 0.05 },
  Mage: { MID: 0.6, SUPPORT: 0.2, TOP: 0.1, ADC: 0.1 },
  Assassin: { MID: 0.6, JUNGLE: 0.2, TOP: 0.2 },
  Fighter: { TOP: 0.6, JUNGLE: 0.25, MID: 0.15 },
  Tank: { TOP: 0.45, SUPPORT: 0.35, JUNGLE: 0.2 },
};

/** Probabilité d'un poste d'après les catégories (la première compte double). */
export function tagLikelihood(tags: readonly string[], role: Role): number | undefined {
  const known = tags.filter((tag) => tag in TAG_ROLES);
  if (known.length === 0) return undefined;
  let total = 0;
  let weight = 0;
  known.slice(0, 2).forEach((tag, index) => {
    const share = index === 0 ? 2 : 1;
    total += (TAG_ROLES[tag]![role] ?? 0) * share;
    weight += share;
  });
  return total / weight;
}

export type LiveDraft = {
  draft: Draft;
  /** Les postes ont été déduits sans statistiques (catégories seules) : à vérifier. */
  guessed: boolean;
};

/**
 * Range la partie en cours dans le tableau. `null` si le joueur n'y figure pas
 * ou si un champion est inconnu de Data Dragon.
 */
export function draftFromActiveGame(
  game: ActiveGameDto,
  myPuuid: string,
  idOf: (championKey: number) => string | null,
  likelihood: (championKey: number, role: Role) => number | undefined,
): Draft | null {
  const me = game.participants.find((participant) => participant.puuid === myPuuid);
  if (!me) return null;

  const side = (teamId: number): { side: DraftSide; roles: Map<number, Role> } | null => {
    const players = game.participants.filter((participant) => participant.teamId === teamId);
    const roles = assignTeamRoles(
      players.map((player) => ({
        champion: player.championId,
        smite: player.spell1Id === SMITE_ID || player.spell2Id === SMITE_ID,
      })),
      likelihood,
    );
    const result = emptySide();
    for (const player of players) {
      const role = roles.get(player.championId);
      const id = idOf(player.championId);
      if (!role) continue;
      if (!id) return null;
      result[role] = id;
    }
    return { side: result, roles };
  };

  const allies = side(me.teamId);
  const enemies = side(me.teamId === 100 ? 200 : 100);
  if (!allies || !enemies) return null;
  const myRole = allies.roles.get(me.championId);
  if (!myRole) return null;
  return { allies: allies.side, enemies: enemies.side, myRole };
}
