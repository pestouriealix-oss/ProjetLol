import "server-only";

import { APP_NAME } from "@/lib/config";
import { env } from "@/lib/env";

import { keepRecent, mergeArticles, parseFeed, toArticles, type Article } from "./feed";
import { NEWS_SOURCES, type NewsSource } from "./sources";

export type { Article } from "./feed";
export type { NewsLanguage, NewsSource } from "./sources";

/** Au-delà, un flux est refusé (un flux RSS fait quelques centaines de Ko). */
const MAX_FEED_BYTES = 3_000_000;
/** Articles gardés par source : un site très prolifique ne masque pas les autres. */
const PER_SOURCE_LIMIT = 20;
/** Nombre d'articles affichés, toutes sources confondues. */
const ARTICLE_LIMIT = 40;

export type ArticleList = {
  articles: Article[];
  /** Sources qui n'ont pas répondu : la page le signale sans masquer les autres. */
  failed: NewsSource[];
};

function feedUrlOf(source: NewsSource): string {
  // Tests : tous les flux viennent d'un serveur local, un fichier par source.
  return env.NEWS_FEEDS_BASE_URL
    ? `${env.NEWS_FEEDS_BASE_URL.replace(/\/$/, "")}/${source.id}.xml`
    : source.feedUrl;
}

async function loadSource(source: NewsSource): Promise<Article[]> {
  const response = await fetch(feedUrlOf(source), {
    headers: {
      Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8",
      "User-Agent": `${APP_NAME}/1.0 (lecteur RSS)`,
    },
    // Un quart d'heure : assez frais pour l'actu, et chaque site n'est lu
    // qu'une fois par quart d'heure, quel que soit le nombre de visiteurs.
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`${source.name} a répondu ${response.status}`);
  const xml = await response.text();
  if (xml.length > MAX_FEED_BYTES) throw new Error(`Flux ${source.name} trop volumineux`);
  return toArticles(source, parseFeed(xml));
}

/**
 * Les articles récents (moins de deux semaines) de toutes les sources. Une
 * source qui ne répond pas n'empêche pas d'afficher les autres ; si aucune ne
 * répond, la liste est vide et toutes figurent dans `failed`.
 */
export async function listArticles(now: Date = new Date()): Promise<ArticleList> {
  const results = await Promise.allSettled(NEWS_SOURCES.map(loadSource));
  const lists: Article[][] = [];
  const failed: NewsSource[] = [];
  results.forEach((result, index) => {
    const source = NEWS_SOURCES[index]!;
    if (result.status === "fulfilled") {
      lists.push(keepRecent(result.value, now).slice(0, PER_SOURCE_LIMIT));
    } else {
      console.error(`Flux d'articles indisponible : ${source.name}`, result.reason);
      failed.push(source);
    }
  });
  return { articles: mergeArticles(lists, ARTICLE_LIMIT), failed };
}
