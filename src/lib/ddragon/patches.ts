import "server-only";
import { z } from "zod";

import { env } from "@/lib/env";

import { toPatches, type Patch } from "./patch-list";

const BASE_URL = env.DDRAGON_BASE_URL ?? "https://ddragon.leagueoflegends.com";

const versionsSchema = z.array(z.string()).min(1);

/**
 * Patchs de la saison en cours, du plus récent au plus ancien, d'après la
 * liste des versions publiée par Riot (Data Dragon). La réponse est gardée une
 * heure : un patch sort toutes les deux semaines.
 *
 * Lève une erreur si Riot ne répond pas ou répond autre chose qu'attendu ;
 * c'est à la page d'afficher son état d'erreur.
 */
export async function listPatches(): Promise<Patch[]> {
  const response = await fetch(`${BASE_URL}/api/versions.json`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Data Dragon a répondu ${response.status}`);
  return toPatches(versionsSchema.parse(await response.json()));
}
