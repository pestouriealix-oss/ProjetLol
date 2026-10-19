/**
 * Vérifie des flux RSS candidats pour l'onglet Actus : répond-il, combien
 * d'articles sur LoL, et de quand date le plus récent.
 *
 *   npm run news:check
 *
 * À lancer depuis ta machine (le réseau de certains environnements bloque ces
 * sites). Rien n'est enregistré : le résultat s'affiche dans le terminal.
 */
import { keepRecent, MAX_ARTICLE_AGE_DAYS, parseFeed, toArticles } from "../src/lib/news/feed";
import { LEAGUE_TOPICS, NEWS_SOURCES, type NewsSource } from "../src/lib/news/sources";

const CANDIDATES: NewsSource[] = [
  ...NEWS_SOURCES,
  {
    id: "dexerto-fr-lol",
    name: "Dexerto FR (LoL)",
    lang: "fr",
    feedUrl: "https://www.dexerto.fr/league-of-legends/feed/",
  },
  {
    id: "millenium",
    name: "Millenium",
    lang: "fr",
    feedUrl: "https://www.millenium.org/rss",
    match: LEAGUE_TOPICS,
  },
  {
    id: "breakflip",
    name: "Breakflip",
    lang: "fr",
    feedUrl: "https://www.breakflip.com/rss",
    match: LEAGUE_TOPICS,
  },
  {
    id: "sheep-fr",
    name: "Sheep Esports FR",
    lang: "fr",
    feedUrl: "https://www.sheepesports.com/fr/feed",
    match: LEAGUE_TOPICS,
  },
  {
    id: "esportsnet-fr",
    name: "Esports.net FR",
    lang: "fr",
    feedUrl: "https://www.esports.net/fr/actualites/lol/feed/",
  },
  {
    id: "jvcom",
    name: "Jeuxvideo.com",
    lang: "fr",
    feedUrl: "https://www.jeuxvideo.com/rss/rss.xml",
    match: LEAGUE_TOPICS,
  },
  {
    id: "dotesports-all",
    name: "Dot Esports (tout)",
    lang: "en",
    feedUrl: "https://dotesports.com/feed",
    match: LEAGUE_TOPICS,
  },
  {
    id: "sheep-en",
    name: "Sheep Esports EN",
    lang: "en",
    feedUrl: "https://www.sheepesports.com/en/feed",
    match: LEAGUE_TOPICS,
  },
  {
    id: "oneesports",
    name: "ONE Esports",
    lang: "en",
    feedUrl: "https://www.oneesports.gg/league-of-legends/feed/",
  },
  {
    id: "esportsnet-en",
    name: "Esports.net EN",
    lang: "en",
    feedUrl: "https://www.esports.net/news/league-of-legends/feed/",
  },
];

async function check(source: NewsSource): Promise<string> {
  try {
    const response = await fetch(source.feedUrl, {
      headers: { Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return `✗ ${response.status}`;
    const articles = toArticles(source, parseFeed(await response.text()));
    const recent = keepRecent(articles, new Date());
    const newest = articles
      .map((article) => article.publishedAt)
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return `${recent.length > 0 ? "✓" : "·"} ${articles.length} sur LoL, ${recent.length} de moins de ${MAX_ARTICLE_AGE_DAYS} jours, dernier : ${newest?.toISOString().slice(0, 10) ?? "aucun"}`;
  } catch (error) {
    return `✗ ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`;
  }
}

async function main() {
  const results = await Promise.all(
    CANDIDATES.map(async (source) => [source, await check(source)] as const),
  );
  for (const [source, result] of results) {
    // Script en ligne de commande : le résultat s'affiche dans le terminal.
    // eslint-disable-next-line no-console
    console.log(`${source.lang.toUpperCase()}  ${source.name.padEnd(22)} ${result}`);
  }
}

void main();
