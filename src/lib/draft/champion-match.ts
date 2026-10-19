/**
 * Retrouve l'identifiant Data Dragon d'un champion à partir d'un nom écrit par
 * le modèle ou par le joueur : casse, accents, espaces et ponctuation ne
 * comptent pas, et les noms français comme anglais sont reconnus.
 */

export type ChampionRef = { id: string; name: string };

/** « Kai'Sa » → « kaisa », « Nunu et Willump » → « nunuetwillump ». */
export function normalizeChampionName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Noms usuels qui ne ressemblent ni à l'identifiant ni au nom affiché. */
const ALIASES: Record<string, string> = {
  wukong: "MonkeyKing",
  nunu: "Nunu",
  nunuwillump: "Nunu",
  nunuandwillump: "Nunu",
  renata: "Renata",
  renataglasc: "Renata",
  jarvan: "JarvanIV",
  jarvan4: "JarvanIV",
  mf: "MissFortune",
  tf: "TwistedFate",
  asol: "AurelionSol",
  kogmaw: "KogMaw",
  reksai: "RekSai",
  belveth: "Belveth",
  chogath: "Chogath",
  khazix: "Khazix",
  velkoz: "Velkoz",
  kaisa: "Kaisa",
  ksante: "KSante",
  drmundo: "DrMundo",
  mundo: "DrMundo",
};

export function createChampionMatcher(champions: readonly ChampionRef[]) {
  const index = new Map<string, string>();
  for (const champion of champions) {
    index.set(normalizeChampionName(champion.id), champion.id);
    index.set(normalizeChampionName(champion.name), champion.id);
  }
  const known = new Set(champions.map((champion) => champion.id));
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (known.has(id) && !index.has(alias)) index.set(alias, id);
  }
  /** L'identifiant du champion, ou `null` s'il n'est pas reconnu. */
  return (raw: string): string | null => {
    const key = normalizeChampionName(raw);
    return key ? (index.get(key) ?? null) : null;
  };
}
