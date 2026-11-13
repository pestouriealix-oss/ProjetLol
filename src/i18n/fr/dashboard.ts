/** Tableau de bord. */
export const dashboard = {
  level: (level: number) => `Niveau ${level}`,
  lp: {
    title: "Courbe des LP",
    empty:
      "Elle se dessine au fil des mises à jour, dès que ton rang bouge. Riot ne donne pas l'historique d'avant.",
    details: "Voir le détail",
  },
  title: "Tableau de bord",
  accounts: "Compte affiché",
  manage: "Gérer les comptes",
  noRoles: "Aucun rôle choisi",
  unowned: "À confirmer",
  sync: {
    action: "Mettre à jour",
    never: "Jamais mis à jour",
    last: (when: string) => `Mis à jour ${when}`,
    newMatches: (count: number) =>
      count === 0
        ? "Tout est à jour."
        : count === 1
          ? "1 nouvelle partie."
          : `${count} nouvelles parties.`,
    partial: "Riot limite le nombre d'appels : relance dans une minute pour la suite.",
    errors: {
      missing_key:
        "La synchronisation n'est pas configurée sur ce serveur (clé de l'API Riot absente).",
      invalid_key: "La clé de l'API Riot est refusée ou expirée.",
      not_found: "Riot ne trouve pas ces données. Réessaie dans quelques minutes.",
      unavailable: "Riot ne répond pas pour l'instant. Réessaie dans quelques minutes.",
      rate_limited: "Trop de demandes envoyées à Riot. Réessaie dans une minute.",
      account_missing: "Ce compte n'existe plus. Recharge la page.",
      player_unknown:
        "Riot ne connaît pas ce Riot ID sur ce serveur. Vérifie son écriture dans les paramètres.",
      player_already_linked: "Ce joueur est déjà lié sous un autre Riot ID.",
      cooldown: (seconds: number) =>
        `Mis à jour à l'instant. Nouvelle mise à jour possible dans ${seconds} s.`,
    },
  },
  start: {
    title: "Trois étapes pour commencer",
    steps: [
      {
        title: "Lie ton compte Riot",
        body: "Ton Riot ID suffit. C'est lui qui dit quelles parties suivre.",
      },
      {
        title: "Tes parties arrivent",
        body: "Classement, champions joués et historique se remplissent tout seuls.",
      },
      {
        title: "Envoie ta draft",
        body: "Pendant la sélection des champions, reçois ta fiche avant le lancement.",
      },
    ],
    action: "Lier un compte Riot",
  },
  rank: {
    title: "Classement",
    pending: "Pas encore mis à jour",
    unranked: "Non classé",
    lp: (lp: number) => `${lp} LP`,
    record: (wins: number, losses: number) => `${wins} V ${losses} D`,
    tiers: {
      IRON: "Fer",
      BRONZE: "Bronze",
      SILVER: "Argent",
      GOLD: "Or",
      PLATINUM: "Platine",
      EMERALD: "Émeraude",
      DIAMOND: "Diamant",
      MASTER: "Maître",
      GRANDMASTER: "Grand Maître",
      CHALLENGER: "Challenger",
    } as Record<string, string>,
  },
  champions: {
    title: "Champions joués",
    empty: "Tes champions apparaîtront ici, avec ton taux de victoire sur chacun.",
    games: (count: number) => (count === 1 ? "1 partie" : `${count} parties`),
    kda: (ratio: string) => `${ratio} KDA`,
  },
  recent: {
    title: "Dernières parties",
    all: "Tout l'historique",
    empty:
      "Clique sur « Mettre à jour » : tes parties récentes s'afficheront ici (classées, normales et parties rapides).",
  },
} as const;
