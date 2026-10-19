/**
 * Sites dont on affiche les articles. Uniquement le titre, un court extrait et
 * un lien : l'article se lit chez eux (jamais recopié ici).
 *
 * Pour ajouter un site : son flux RSS, sa langue, et un filtre si le flux
 * couvre d'autres jeux que League of Legends.
 */

import { APP_NAME } from "../config";

export type NewsLanguage = "fr" | "en";

/** Comment le site se présente aux flux : un lecteur RSS, sous son vrai nom. */
export const FEED_USER_AGENT = `${APP_NAME}/1.0 (lecteur RSS)`;
export const FEED_ACCEPT = "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8";

export type NewsSource = {
  /** Identifiant stable (sert aussi de nom de fichier pour les flux de test). */
  id: string;
  name: string;
  lang: NewsLanguage;
  feedUrl: string;
  /**
   * Pour un flux généraliste : ne garder que les articles dont le titre ou une
   * catégorie correspond.
   */
  match?: RegExp;
  /**
   * Agrégateur (Google Actualités) : chaque article indique son site d'origine,
   * affiché à la place du nom de la source, et n'a pas d'extrait à lui.
   */
  aggregator?: boolean;
};

/** Mots qui signalent un article sur League of Legends ou sa scène. */
export const LEAGUE_TOPICS =
  /league of legends|\blol\b|\bworlds\b|\bmsi\b|\blfl\b|\blec\b|\blck\b|\blpl\b|karmine|\bfaker\b|\bT1\b/i;

/**
 * Recherche Google Actualités sur « League of Legends », articles des sept
 * derniers jours. Elle regroupe les sites qui bloquent les lecteurs RSS
 * (Millenium, Sheep Esports, Dot Esports…).
 *
 * Les conditions de Google réservent ces flux à un usage personnel et non
 * commercial : à remplacer par une API d'actualités sous licence avant
 * d'ouvrir le site au public payant.
 */
const googleNews = (lang: NewsLanguage) => {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", '"League of Legends" when:7d');
  if (lang === "fr") {
    url.searchParams.set("hl", "fr");
    url.searchParams.set("gl", "FR");
    url.searchParams.set("ceid", "FR:fr");
  } else {
    url.searchParams.set("hl", "en-US");
    url.searchParams.set("gl", "US");
    url.searchParams.set("ceid", "US:en");
  }
  return url.toString();
};

export const NEWS_SOURCES: readonly NewsSource[] = [
  {
    id: "gnews-fr",
    name: "Google Actualités",
    lang: "fr",
    feedUrl: googleNews("fr"),
    aggregator: true,
  },
  {
    id: "gnews-en",
    name: "Google News",
    lang: "en",
    feedUrl: googleNews("en"),
    aggregator: true,
  },
  {
    id: "journaldugeek-fr",
    name: "Journal du Geek",
    lang: "fr",
    feedUrl: "https://www.journaldugeek.com/tag/league-of-legends/feed/",
  },
  {
    // Peu actif sur LoL depuis l'été, gardé au cas où il reprend.
    id: "dexerto-en",
    name: "Dexerto",
    lang: "en",
    feedUrl: "https://www.dexerto.com/league-of-legends/feed/",
  },
  {
    // Le flux français de Dexerto couvre tous les jeux : on ne garde que LoL.
    id: "dexerto-fr",
    name: "Dexerto FR",
    lang: "fr",
    feedUrl: "https://www.dexerto.fr/feed/",
    match: LEAGUE_TOPICS,
  },
];
