/** Paramètres et comptes Riot. */
export const settings = {
  title: "Paramètres",
  riot: {
    rso: {
      action: "Se connecter avec Riot",
      hint: "Le plus simple : tu te connectes chez Riot, ton compte est lié et vérifié, sans taper ton Riot ID.",
      or: "ou avec ton Riot ID",
      results: {
        linked: "Compte lié et vérifié avec Riot.",
        state: "La connexion à Riot a expiré. Réessaie.",
        denied: "Connexion à Riot annulée.",
        limit: "Tu as atteint la limite de comptes liés pour ton offre.",
        taken:
          "Ce Riot ID est déjà dans ta liste, rattaché à un autre joueur (un pseudo peut changer de propriétaire). Supprime l'ancienne ligne ci-dessous, puis reconnecte-toi avec Riot.",
        platform: "Ton serveur n'est pas reconnu. Ajoute ton compte avec ton Riot ID.",
        unavailable:
          "Riot ne répond pas pour l'instant. Réessaie dans un instant, ou ajoute ton compte avec ton Riot ID.",
      },
    },
    title: "Comptes Riot",
    description:
      "Les comptes dont les parties seront suivies. Le compte principal est sélectionné par défaut dans l'application.",
    emptyTitle: "Aucun compte lié",
    emptyBody:
      "Ajoute ton Riot ID ci-dessous. Tu le trouves dans le client, en survolant ton pseudo.",
    addTitle: "Ajouter un compte",
    riotId: "Riot ID",
    riotIdPlaceholder: "Pseudo#TAG",
    riotIdHint: "Le pseudo, un dièse, puis le tag. Exemple : Pseudo#EUW.",
    platform: "Serveur",
    roles: "Rôles principaux",
    rolesHint: "Deux au maximum.",
    rolesFor: (riotId: string) => `Rôles principaux de ${riotId}`,
    add: "Ajouter le compte",
    removeLabel: (riotId: string) => `Retirer ${riotId}`,
    removeTitle: (riotId: string) => `Retirer ${riotId} ?`,
    removeBody:
      "Les parties et les bilans rattachés à ce compte seront supprimés. Cette action est définitive.",
    removeConfirm: "Retirer le compte",
    makePrimary: "Définir comme principal",
    primary: "Principal",
    limit: (used: number, max: number) => `${used} sur ${max} compte${max > 1 ? "s" : ""}`,
    ownership: {
      badge: "À confirmer",
      owned: "Confirmé",
      why: "Le coach (bilans, objectifs, fiche en direct) ne travaille que pour tes propres comptes. Prouve que celui-ci est à toi : 30 secondes dans le client du jeu.",
      start: "Confirmer que c'est mon compte",
      title: "Mets cette icône sur ton compte",
      steps: [
        "Dans le client League of Legends, clique sur ton icône en haut à droite.",
        "Choisis celle-ci : c'est une icône de départ, tout le monde l'a.",
        "Reviens ici et clique sur Vérifier. Tu pourras remettre ton icône juste après.",
      ],
      iconLabel: (id: number) => `Icône de départ numéro ${id}`,
      until: (time: string) => `Valable jusqu'à ${time}`,
      check: "Vérifier",
      later: "Plus tard",
      restart: "Recommencer",
      done: "Compte confirmé. Tu peux remettre ton icône.",
      errors: {
        icon_mismatch:
          "Riot montre encore une autre icône sur ce compte. Le changement peut prendre une minute : réessaie.",
        expired: "Le délai est passé. Recommence pour obtenir une nouvelle icône.",
        no_challenge: "Aucune vérification en cours. Recommence.",
        player_unknown: "Riot ne connaît pas ce Riot ID sur ce serveur. Vérifie son orthographe.",
        player_already_linked: "Ce joueur est déjà lié à ton compte sous un autre Riot ID.",
        account_missing: "Ce compte n'existe plus. Recharge la page.",
        too_many: "Trop d'essais. Réessaie dans quelques minutes.",
        rate_limited: "Riot demande de patienter. Réessaie dans une minute.",
        missing_key: "La clé de l'API Riot n'est pas configurée sur le serveur.",
        invalid_key: "La clé de l'API Riot est refusée ou expirée.",
        not_found: "Riot ne trouve pas ce compte. Recharge la page.",
        unavailable: "Riot ne répond pas pour l'instant. Réessaie dans un moment.",
      },
    },
    freeSlot: "Emplacement libre",
    errors: {
      riotIdFormat: "Le Riot ID doit avoir la forme Pseudo#TAG.",
      gameNameLength: "Le pseudo doit faire entre 3 et 16 caractères.",
      tagLineFormat: "Le tag doit faire entre 3 et 5 lettres ou chiffres.",
      platformInvalid: "Choisis un serveur dans la liste.",
      tooManyRoles: "Deux rôles au maximum.",
      duplicate: "Ce compte est déjà lié.",
      limitReached: (max: number) =>
        max > 1
          ? `Ton offre permet de lier ${max} comptes. Retire-en un pour en ajouter un autre.`
          : "L'offre gratuite permet de lier un compte. Retire-le pour en lier un autre, ou passe à Premium pour en lier plus.",
      notFound: "Ce compte n'existe plus. Recharge la page.",
      unknown: "L'enregistrement a échoué. Réessaie dans un instant.",
    },
  },
  account: {
    upgrade: "Passer Premium",
    managePlan: "Gérer mon abonnement",
    title: "Compte",
    email: "E-mail",
    plan: "Offre",
    signOut: "Se déconnecter",
    dangerTitle: "Supprimer mon compte",
    dangerBody:
      "Supprime ton compte et toutes tes données : comptes Riot liés, analyses, bilans et notes. Un abonnement Premium en cours est résilié. Cette action est définitive.",
    delete: "Supprimer mon compte",
    deleteTitle: "Supprimer définitivement ton compte ?",
    deleteBody:
      "Toutes tes données seront effacées immédiatement et ne pourront pas être récupérées.",
    deleteConfirm: "Supprimer mon compte",
    deleteBlocked:
      "Ton abonnement Premium n'a pas pu être résilié : résilie-le depuis « Gérer mon abonnement », puis supprime ton compte.",
  },
} as const;
