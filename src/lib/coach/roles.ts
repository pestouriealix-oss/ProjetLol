import "server-only";

import { listAllChampionRoleStats, listStatPatches } from "@/lib/db/matchup-stats";
import type { ChampionAssets } from "@/lib/ddragon/champions";
import { tagLikelihood } from "@/lib/draft/live";
import { roleShares } from "@/lib/stats/matchups";

import type { RoleHints } from "./read-draft";

/**
 * Probabilité de chaque poste pour chaque champion : d'après nos parties
 * classées (patch le plus récent), et à défaut d'après ses catégories Data
 * Dragon. Sert à placer les champions dont on ne connaît pas le poste.
 */
export async function loadRoleHints(champions: ChampionAssets): Promise<RoleHints> {
  let shares: ReturnType<typeof roleShares> = () => undefined;
  try {
    const [latest] = await listStatPatches();
    if (latest) shares = roleShares(await listAllChampionRoleStats(latest.patch));
  } catch (error) {
    console.error("Statistiques de postes indisponibles", error);
  }
  return {
    keyOf: champions.keyOf,
    likelihood: (key, role) => {
      const fromStats = shares(key, role);
      if (fromStats !== undefined) return fromStats;
      const champion = champions.byKey(key);
      return champion ? tagLikelihood(champions.tags(champion.id), role) : undefined;
    },
  };
}
