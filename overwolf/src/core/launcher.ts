import { z } from "zod";

/**
 * Les mises à jour d'Overwolf (lanceur et partie) arrivent sous deux formes
 * selon la version : `{ info: { catégorie: { clé: valeur } } }` ou une seule
 * entrée `{ category, key, value }`. Les deux sont ramenées à une liste
 * d'entrées. Tout ce qui ne colle pas est ignoré.
 */
export type InfoEntry = { category: string; key: string; value: unknown };

const nested = z.object({
  info: z.record(z.string(), z.record(z.string(), z.unknown())),
});
const flat = z.object({ category: z.string(), key: z.string(), value: z.unknown() });

export function readInfoEntries(payload: unknown): InfoEntry[] {
  const asNested = nested.safeParse(payload);
  if (asNested.success) {
    return Object.entries(asNested.data.info).flatMap(([category, values]) =>
      Object.entries(values).map(([key, value]) => ({ category, key, value })),
    );
  }
  const asFlat = flat.safeParse(payload);
  return asFlat.success ? [asFlat.data] : [];
}

/** La valeur d'une entrée, si c'est celle cherchée. */
export function findEntry(entries: InfoEntry[], category: string, key: string): unknown {
  return entries.find((entry) => entry.category === category && entry.key === key)?.value;
}

/** Les événements de partie : `{ events: [{ name, data }] }`. */
const eventsSchema = z.object({
  events: z.array(z.object({ name: z.string(), data: z.unknown().optional() })),
});

export function readEventNames(payload: unknown): string[] {
  const parsed = eventsSchema.safeParse(payload);
  return parsed.success ? parsed.data.events.map((event) => event.name) : [];
}

/** Une valeur JSON qui arrive parfois en texte, parfois déjà lue. */
export function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

const gameDataSchema = z.object({ gameTime: z.coerce.number() });

/**
 * Vrai quand la partie a vraiment commencé (l'horloge tourne) : les données
 * de la partie n'arrivent qu'une fois l'écran de chargement passé.
 */
export function matchHasStarted(entries: InfoEntry[], eventNames: string[]): boolean {
  if (eventNames.includes("match_clock")) return true;
  const data = gameDataSchema.safeParse(
    parseMaybeJson(findEntry(entries, "live_client_data", "game_data")),
  );
  return data.success && data.data.gameTime >= 1;
}
