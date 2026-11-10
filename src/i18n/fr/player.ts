import { APP_NAME } from "@/lib/config";

/** Recherche d'un joueur et profil public. */
export const player = {
  searchTitle: "Chercher un joueur",
  searchOpen: "Chercher un joueur",
  searchIntro:
    "Le profil de n'importe quel joueur : son classement, ses dernières parties et ses champions, lus chez Riot.",
  riotId: "Riot ID",
  riotIdHint: "Le pseudo et le tag, comme dans le client.",
  riotIdPlaceholder: "Pseudo#TAG",
  server: "Serveur",
  search: "Chercher",
  yourAccounts: "Tes comptes",
  title: "Profil du joueur",
  loading: "Chargement du profil…",
  yours: "C'est ton compte",
  toDashboard: "Ouvrir mon tableau de bord",
  loadedAt: (when: string) => `Données Riot, lues ${when}`,
  partial:
    "Riot a limité les appels en cours de route : quelques parties récentes manquent. Recharge la page dans une minute.",
  champions: {
    empty: "Aucune partie récente sur la Faille : rien à compter pour l'instant.",
  },
  recent: {
    title: "Dernières parties",
    hint: (count: number) =>
      `Parmi ses ${count} dernières parties, celles jouées sur la Faille de l'invocateur.`,
    emptyTitle: "Aucune partie récente",
    emptyBody:
      "Ses dernières parties ne sont pas sur la Faille (ARAM, Arène…), ou Riot n'en garde aucune.",
  },
  notFoundTitle: "Joueur introuvable",
  notFoundBody: (riotId: string, server: string) =>
    `Riot ne trouve personne sous ${riotId} sur le serveur ${server}. Vérifie le tag, ou essaie un autre serveur.`,
  errorTitle: "Le profil n'a pas pu être chargé",
  retry: "Réessayer",
  errors: {
    missing_key: "La recherche n'est pas configurée sur ce serveur (clé de l'API Riot absente).",
    invalid_key: "La clé de l'API Riot est refusée ou expirée.",
    rate_limited: "Trop de demandes envoyées à Riot. Réessaie dans une minute.",
    unavailable: "Riot ne répond pas pour l'instant. Réessaie dans quelques minutes.",
    not_found: "Riot ne trouve pas ce joueur.",
    too_many: `Tu as ouvert beaucoup de profils en peu de temps. ${APP_NAME} les limite pour ne pas épuiser l'accès à Riot : réessaie dans une heure.`,
  },
  openProfile: (riotId: string) => `Voir le profil de ${riotId}`,
} as const;
