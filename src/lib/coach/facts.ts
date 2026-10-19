import "server-only";

import type { Role } from "@/lib/config";
import { findMatchupStat, listChampionRoleStats, listStatPatches } from "@/lib/db/matchup-stats";
import { getChampionDetails, type ChampionDetails } from "@/lib/ddragon/champion-details";
import type { SheetFacts } from "@/lib/draft/sheet-view";
import { MIN_RELIABLE_GAMES, patchOfVersion, winRate, type WinRate } from "@/lib/stats/matchups";

/**
 * Les faits vérifiés donnés au coach avant qu'il écrive : la fiche technique
 * des deux champions du duel (Data Dragon, patch en cours) et les résultats
 * réels du duel dans nos parties classées Émeraude et plus.
 */

export type MatchupFacts = {
  facts: SheetFacts;
  mine: ChampionDetails | null;
  theirs: ChampionDetails | null;
  /** Taux de victoire au poste, sur le même patch que le duel. */
  roleRates: { mine: WinRate | null; theirs: WinRate | null };
};

/**
 * Le patch des statistiques : celui du jeu s'il a déjà assez de parties,
 * sinon le plus récent qui en a (début de patch).
 */
async function statsPatch(gamePatch: string): Promise<{ patch: string; matches: number } | null> {
  const patches = await listStatPatches();
  const current = patches.find((entry) => entry.patch === gamePatch);
  if (current && current.matches >= MIN_RELIABLE_GAMES * 25) return current;
  return patches[0] ?? null;
}

export async function loadMatchupFacts(options: {
  ddragonVersion: string;
  role: Role;
  mine: { id: string; key: number | null };
  theirs: { id: string; key: number | null };
}): Promise<MatchupFacts> {
  const { ddragonVersion, role, mine, theirs } = options;
  const gamePatch = patchOfVersion(ddragonVersion);

  const [mineDetails, theirsDetails, patch] = await Promise.all([
    getChampionDetails(ddragonVersion, mine.id),
    getChampionDetails(ddragonVersion, theirs.id),
    statsPatch(gamePatch).catch((error: unknown) => {
      // Sans statistiques, la fiche s'écrit quand même, en le disant.
      console.error("Statistiques de matchups indisponibles", error);
      return null;
    }),
  ]);

  let stats: SheetFacts["stats"] = null;
  const roleRates: MatchupFacts["roleRates"] = { mine: null, theirs: null };
  if (patch && mine.key !== null && theirs.key !== null) {
    const [duel, roleRows] = await Promise.all([
      findMatchupStat(patch.patch, role, mine.key, theirs.key),
      listChampionRoleStats(patch.patch, [mine.key, theirs.key]),
    ]);
    const atRole = (key: number) => {
      const row = roleRows.find(
        (candidate) => candidate.champion === key && candidate.role === role,
      );
      return row ? winRate(row.games, row.wins) : null;
    };
    roleRates.mine = atRole(mine.key);
    roleRates.theirs = atRole(theirs.key);
    stats = {
      patch: patch.patch,
      matches: patch.matches,
      matchup: duel,
      reliable: duel !== null && winRate(duel.games, duel.wins).reliable,
    };
  }

  return {
    facts: { patch: gamePatch, ddragonVersion, stats },
    mine: mineDetails,
    theirs: theirsDetails,
    roleRates,
  };
}
