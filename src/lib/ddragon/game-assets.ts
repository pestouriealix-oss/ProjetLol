import "server-only";
import { z } from "zod";

import { env } from "@/lib/env";

import { listPatches } from "./patches";

const BASE_URL = env.DDRAGON_BASE_URL ?? "https://ddragon.leagueoflegends.com";

const itemsSchema = z.object({
  data: z.record(z.string(), z.looseObject({ name: z.string() })),
});

const spellsSchema = z.object({
  data: z.record(z.string(), z.looseObject({ id: z.string(), key: z.string(), name: z.string() })),
});

const runeSchema = z.looseObject({ id: z.number().int(), icon: z.string(), name: z.string() });
const runesSchema = z.array(
  runeSchema.extend({
    slots: z.array(z.looseObject({ runes: z.array(runeSchema) })),
  }),
);

/** Une image du jeu et son nom, prêts à afficher. */
export type GameAsset = { name: string; iconUrl: string };

export type GameAssets = {
  item: (id: number) => GameAsset | null;
  spell: (key: number) => GameAsset | null;
  /** Une rune ou un arbre de runes, par son identifiant. */
  rune: (id: number) => GameAsset | null;
};

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Data Dragon a répondu ${response.status} pour ${url}`);
  return response.json();
}

/**
 * Objets, sorts d'invocateur et runes du patch en cours, en français, servis
 * par Data Dragon. Renvoie `null` si Riot ne répond pas : la page affiche
 * alors des emplacements vides plutôt que de tomber.
 */
export async function getGameAssets(): Promise<GameAssets | null> {
  try {
    const [latest] = await listPatches();
    if (!latest) return null;
    const data = `${BASE_URL}/cdn/${latest.version}/data/fr_FR`;
    const [items, spells, runes] = await Promise.all([
      fetchJson(`${data}/item.json`).then((json) => itemsSchema.parse(json).data),
      fetchJson(`${data}/summoner.json`).then((json) => spellsSchema.parse(json).data),
      fetchJson(`${data}/runesReforged.json`).then((json) => runesSchema.parse(json)),
    ]);

    const spellsByKey = new Map(
      Object.values(spells).map((spell) => [
        Number(spell.key),
        {
          name: spell.name,
          iconUrl: `${BASE_URL}/cdn/${latest.version}/img/spell/${spell.id}.png`,
        },
      ]),
    );
    const runesById = new Map<number, GameAsset>();
    for (const style of runes) {
      runesById.set(style.id, { name: style.name, iconUrl: `${BASE_URL}/cdn/img/${style.icon}` });
      for (const slot of style.slots) {
        for (const rune of slot.runes) {
          runesById.set(rune.id, { name: rune.name, iconUrl: `${BASE_URL}/cdn/img/${rune.icon}` });
        }
      }
    }

    return {
      item: (id) => {
        const item = items[String(id)];
        return item
          ? { name: item.name, iconUrl: `${BASE_URL}/cdn/${latest.version}/img/item/${id}.png` }
          : null;
      },
      spell: (key) => spellsByKey.get(key) ?? null,
      rune: (id) => runesById.get(id) ?? null,
    };
  } catch (error) {
    console.error("Objets, sorts ou runes indisponibles", error);
    return null;
  }
}
