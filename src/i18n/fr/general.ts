/** Navigation, rôles, offres et textes communs. */
export const nav = {
  dashboard: "Tableau de bord",
  dashboardShort: "Accueil",
  newGame: "Nouvelle game",
  newGameShort: "Game",
  matches: "Parties",
  news: "Actus",
  esport: "Esport",
  stats: "Stats",
  progression: "Progression",
  progressionShort: "Progrès",
  settings: "Paramètres",
  main: "Navigation principale",
  accountMenu: "Menu du compte",
  signOut: "Se déconnecter",
} as const;

export const roles = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MID: "Mid",
  ADC: "ADC",
  SUPPORT: "Support",
} as const;

export const plans = {
  FREE: "Gratuit",
  PREMIUM: "Premium",
} as const;

export const common = {
  cancel: "Annuler",
  retry: "Réessayer",
  loading: "Chargement…",
  errorTitle: "Cette page n'a pas pu s'afficher",
  errorBody:
    "Une erreur est survenue de notre côté. Réessaie, et si elle persiste, reviens dans quelques minutes.",
  notFoundTitle: "Page introuvable",
  notFoundBody: "Cette adresse ne correspond à aucune page.",
  backHome: "Revenir au tableau de bord",
  skipToContent: "Aller au contenu",
} as const;
