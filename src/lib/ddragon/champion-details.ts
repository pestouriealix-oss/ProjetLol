import "server-only";
import { z } from "zod";

import { env } from "@/lib/env";

/**
 * Fiche technique d'un champion pour le patch en cours (Data Dragon, en
 * français) : passif et compétences avec leur délai de récupération. C'est ce
 * qui ancre la fiche de draft dans les vrais chiffres du patch.
 */

const BASE_URL = env.DDRAGON_BASE_URL ?? "https://ddragon.leagueoflegends.com";

const detailsSchema = z.object({
  data: z.record(
    z.string(),
    z.looseObject({
      id: z.string(),
      name: z.string(),
      title: z.string().optional().default(""),
      tags: z.array(z.string()).optional().default([]),
      passive: z.looseObject({ name: z.string(), description: z.string() }),
      spells: z
        .array(
          z.looseObject({
            name: z.string(),
            description: z.string(),
            cooldownBurn: z.string().optional().default(""),
          }),
        )
        .length(4),
    }),
  ),
});

export type ChampionDetails = {
  id: string;
  name: string;
  title: string;
  tags: string[];
  passive: { name: string; text: string };
  spells: { key: "Q" | "W" | "E" | "R"; name: string; cooldown: string; text: string }[];
};

const KEYS = ["Q", "W", "E", "R"] as const;
/** Une description de compétence tient en deux ou trois phrases. */
const TEXT_LENGTH = 320;

/** Texte brut d'une description Data Dragon (balises retirées, espaces regroupés). */
export function ddragonText(value: string): string {
  const text = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= TEXT_LENGTH) return text;
  const cut = text.slice(0, TEXT_LENGTH);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), TEXT_LENGTH * 0.6))}…`;
}

export async function getChampionDetails(
  version: string,
  championId: string,
): Promise<ChampionDetails | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/cdn/${version}/data/fr_FR/champion/${encodeURIComponent(championId)}.json`,
      { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) return null;
    const { data } = detailsSchema.parse(await response.json());
    const champion = Object.values(data)[0];
    if (!champion) return null;
    return {
      id: champion.id,
      name: champion.name,
      title: champion.title,
      tags: champion.tags,
      passive: { name: champion.passive.name, text: ddragonText(champion.passive.description) },
      spells: champion.spells.map((spell, index) => ({
        key: KEYS[index]!,
        name: spell.name,
        cooldown: spell.cooldownBurn,
        text: ddragonText(spell.description),
      })),
    };
  } catch (error) {
    console.error(`Fiche Data Dragon indisponible pour ${championId}`, error);
    return null;
  }
}
