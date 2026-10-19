import "server-only";

import { listRiotAccounts } from "@/lib/db/riot-accounts";
import { getChampionAssets } from "@/lib/ddragon/champions";
import type { Draft } from "@/lib/draft/draft";
import { draftFromActiveGame } from "@/lib/draft/live";
import { riotApi } from "@/lib/riot";

import { CoachError } from "./errors";
import { loadRoleHints } from "./roles";

export type LiveDraftResult =
  | { status: "found"; draft: Draft; riotId: string }
  | { status: "not_in_game" }
  | { status: "no_account" };

/**
 * La draft de la partie que le joueur est en train de charger, lue chez Riot
 * (Spectator-V5) pour chacun de ses comptes liés, le principal d'abord. Riot ne
 * la montre qu'une fois la sélection terminée, pendant l'écran de chargement.
 */
export async function loadLiveDraft(userId: string): Promise<LiveDraftResult> {
  const accounts = await listRiotAccounts(userId);
  if (accounts.length === 0) return { status: "no_account" };
  const champions = await getChampionAssets();
  if (!champions) throw new CoachError("champions_unavailable", "Data Dragon ne répond pas.");

  // Déjà triés, le principal d'abord ; un compte pas encore vérifié n'a pas de PUUID.
  for (const account of accounts) {
    if (!account.puuid) continue;
    const puuid = account.puuid;
    const game = await riotApi.getActiveGame(account.platform, puuid);
    if (!game) continue;
    const hints = await loadRoleHints(champions);
    const draft = draftFromActiveGame(
      game,
      puuid,
      (key) => champions.byKey(key)?.id ?? null,
      hints.likelihood,
    );
    if (draft) return { status: "found", draft, riotId: account.gameName };
  }
  return { status: "not_in_game" };
}
