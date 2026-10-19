/**
 * Sites dont on affiche les articles. Uniquement le titre, un court extrait et
 * un lien : l'article se lit chez eux (jamais recopié ici).
 *
 * Pour ajouter un site : son flux RSS, sa langue, et un filtre si le flux
 * couvre d'autres jeux que League of Legends.
 */

export type NewsLanguage = "fr" | "en";

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
};

/** Mots qui signalent un article sur League of Legends ou sa scène. */
const LEAGUE_TOPICS =
  /league of legends|\blol\b|\bworlds\b|\bmsi\b|\blfl\b|\blec\b|\blck\b|\blpl\b|karmine|\bfaker\b|\bT1\b/i;

export const NEWS_SOURCES: readonly NewsSource[] = [
  {
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
