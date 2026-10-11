import "server-only";
import { z } from "zod";

import { env } from "@/lib/env";

import { listPatches } from "./patches";

const BASE_URL = env.DDRAGON_BASE_URL ?? "https://ddragon.leagueoflegends.com";

const championsSchema = z.object({
  data: z.record(z.string(), z.looseObject({ id: z.string(), name: z.string() })),
});

/** Match-V5 écrit quelques identifiants autrement que Data Dragon. */
const ID_FIXES: Record<string, string> = { FiddleSticks: "Fiddlesticks" };

export type ChampionAssets = {
  /** Nom affiché du champion (« Lee Sin »), à défaut son identifiant. */
  name: (championId: string) => string;
  /** Portrait carré du champion, servi par Data Dragon. */
  iconUrl: (championId: string) => string;
};

/**
 * Noms français et portraits des champions pour le patch en cours. Renvoie
 * `null` si Riot ne répond pas : l'interface affiche alors les identifiants,
 * sans image.
 */
export async function getChampionAssets(): Promise<ChampionAssets | null> {
  try {
    const [latest] = await listPatches();
    if (!latest) return null;
    const response = await fetch(`${BASE_URL}/cdn/${latest.version}/data/fr_FR/champion.json`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const { data } = championsSchema.parse(await response.json());
    const fix = (id: string) => ID_FIXES[id] ?? id;
    return {
      name: (id) => data[fix(id)]?.name ?? id,
      iconUrl: (id) => `${BASE_URL}/cdn/${latest.version}/img/champion/${fix(id)}.png`,
    };
  } catch (error) {
    console.error("Données des champions indisponibles", error);
    return null;
  }
}
