import "server-only";
import { z } from "zod";

import { listRiotAccounts } from "@/lib/db/riot-accounts";
import type { RiotAccount } from "@/lib/db/schema";

/** Compte demandé dans l'adresse (`?compte=`) ; toute valeur inattendue est ignorée. */
const accountParam = z.string().min(1).max(64).optional().catch(undefined);

export type AccountSearchParams = Promise<{ compte?: string | string[] }>;

/**
 * Comptes Riot de l'utilisateur et celui que la page affiche : celui de
 * l'adresse s'il lui appartient, sinon son compte principal.
 */
export async function getSelectedAccount(
  userId: string,
  searchParams: AccountSearchParams,
): Promise<{ accounts: RiotAccount[]; account: RiotAccount | undefined }> {
  const [accounts, params] = await Promise.all([listRiotAccounts(userId), searchParams]);
  const requested = accountParam.parse(params.compte);
  // La liste est triée compte principal en tête.
  const account = accounts.find((candidate) => candidate.id === requested) ?? accounts[0];
  return { accounts, account };
}
