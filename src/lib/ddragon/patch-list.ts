/**
 * Des versions de Data Dragon aux patchs tels que les joueurs les nomment.
 * Fonctions pures, testées sans réseau.
 */

export type Patch = {
  /** Nom public du patch, par exemple « 26.20 ». */
  id: string;
  /** Version Data Dragon correspondante, par exemple « 16.20.1 ». */
  version: string;
  /** Notes de patch officielles, en français. */
  notesUrl: string;
};

/**
 * Depuis la saison 2025, Riot nomme ses patchs d'après l'année (25.1, 26.20…)
 * alors que les versions techniques ont continué leur numérotation (15.1.1,
 * 16.20.1…) : l'écart est de dix.
 */
const SEASON_OFFSET = 10;
const FIRST_SEASON_WITH_OFFSET = 15;

const VERSION = /^(\d+)\.(\d+)\.\d+$/;

export function patchNotesUrl(id: string): string {
  return `https://www.leagueoflegends.com/fr-fr/news/game-updates/league-of-legends-patch-${id.replace(".", "-")}-notes/`;
}

/**
 * Garde les patchs de la saison la plus récente, un par patch (la liste de
 * Riot contient aussi des correctifs et d'anciennes entrées au format
 * différent, ignorés). L'ordre de Riot, du plus récent au plus ancien, est
 * conservé.
 */
export function toPatches(versions: readonly string[]): Patch[] {
  const patches: Patch[] = [];
  const seen = new Set<string>();
  let season: number | undefined;

  for (const version of versions) {
    const match = VERSION.exec(version);
    if (!match) continue;
    const major = Number(match[1]);
    const minor = Number(match[2]);
    season ??= major;
    if (major !== season) break;

    const year = major >= FIRST_SEASON_WITH_OFFSET ? major + SEASON_OFFSET : major;
    const id = `${year}.${minor}`;
    if (seen.has(id)) continue;
    seen.add(id);
    patches.push({ id, version, notesUrl: patchNotesUrl(id) });
  }
  return patches;
}
