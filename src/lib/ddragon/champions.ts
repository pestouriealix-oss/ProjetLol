import "server-only";
import { z } from "zod";

import { env } from "@/lib/env";

import { listPatches } from "./patches";

const BASE_URL = env.DDRAGON_BASE_URL ?? "https://ddragon.leagueoflegends.com";

const championsSchema = z.object({
  data: z.record(
    z.string(),
    z.looseObject({
      id: z.string(),
      key: z.string().optional(),
      name: z.string(),
      /** Catégories du champion (« Fighter », « Mage », « Marksman »…). */
      tags: z.array(z.string()).optional().default([]),
    }),
  ),
});

/** Match-V5 écrit quelques identifiants autrement que Data Dragon. */
const ID_FIXES: Record<string, string> = { FiddleSticks: "Fiddlesticks" };

export type ChampionAssets = {
  /** Version de Data Dragon (« 16.20.1 ») : le patch en cours. */
  version: string;
  /** Tous les champions, triés par nom affiché. */
  list: () => { id: string; name: string; iconUrl: string }[];
  /** Nom affiché du champion (« Lee Sin »), à défaut son identifiant. */
  name: (championId: string) => string;
  /** Portrait carré du champion, servi par Data Dragon. */
  iconUrl: (championId: string) => string;
  /** Icône d'invocateur, servie par Data Dragon. */
  profileIconUrl: (profileIconId: number) => string;
  /** Champion par son numéro (celui de Spectator-V5) : identifiant, nom et portrait. */
  byKey: (key: number) => { id: string; name: string; iconUrl: string } | null;
  /** Numéro du champion (Match-V5, Spectator-V5), ou `null` s'il est inconnu. */
  keyOf: (championId: string) => number | null;
  /** Catégories Data Dragon du champion (« Fighter », « Support »…). */
  tags: (championId: string) => string[];
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
    const byKey = new Map(
      Object.values(data).flatMap((champion) => (champion.key ? [[champion.key, champion]] : [])),
    );
    const sorted = Object.values(data)
      .map((champion) => ({
        id: champion.id,
        name: champion.name,
        iconUrl: `${BASE_URL}/cdn/${latest.version}/img/champion/${champion.id}.png`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return {
      version: latest.version,
      list: () => sorted,
      name: (id) => data[fix(id)]?.name ?? id,
      iconUrl: (id) => `${BASE_URL}/cdn/${latest.version}/img/champion/${fix(id)}.png`,
      profileIconUrl: (id) => `${BASE_URL}/cdn/${latest.version}/img/profileicon/${id}.png`,
      keyOf: (id) => {
        const key = Number(data[fix(id)]?.key);
        return Number.isInteger(key) ? key : null;
      },
      tags: (id) => data[fix(id)]?.tags ?? [],
      byKey: (key) => {
        const champion = byKey.get(String(key));
        return champion
          ? {
              id: champion.id,
              name: champion.name,
              iconUrl: `${BASE_URL}/cdn/${latest.version}/img/champion/${champion.id}.png`,
            }
          : null;
      },
    };
  } catch (error) {
    console.error("Données des champions indisponibles", error);
    return null;
  }
}
