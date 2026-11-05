/**
 * Tous les textes de l'interface, en français. Aucun composant ne contient de
 * texte en dur. Les textes vivent dans `src/i18n/fr/`, un fichier par partie
 * du site ; ce fichier les assemble en un seul objet, `t`. Une traduction se
 * fera en ajoutant un dossier jumeau.
 */
import { auth, emails } from "./fr/auth";
import { dashboard } from "./fr/dashboard";
import { draft } from "./fr/draft";
import { esport } from "./fr/esport";
import { legal } from "./fr/legal";
import { live } from "./fr/live";
import { matches, matchDetail } from "./fr/matches";
import { nav, roles, plans, common } from "./fr/general";
import { news } from "./fr/news";
import { premium } from "./fr/premium";
import { settings } from "./fr/settings";
import { stats } from "./fr/stats";

export const fr = {
  nav,
  roles,
  plans,
  auth,
  dashboard,
  draft,
  matches,
  matchDetail,
  premium,
  settings,
  news,
  stats,
  live,
  esport,
  common,
  emails,
  legal,
} as const;

export const t = fr;
