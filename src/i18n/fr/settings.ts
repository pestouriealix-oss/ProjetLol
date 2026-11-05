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
    unverified: "Non vérifié",
    unverifiedHint: "Ce compte sera vérifié auprès de Riot à la première synchronisation.",
    limit: (used: number, max: number) => `${used} sur ${max} comptes`,
    freeSlot: "Emplacement libre",
    errors: {
      riotIdFormat: "Le Riot ID doit avoir la forme Pseudo#TAG.",
      gameNameLength: "Le pseudo doit faire entre 3 et 16 caractères.",
      tagLineFormat: "Le tag doit faire entre 3 et 5 lettres ou chiffres.",
      platformInvalid: "Choisis un serveur dans la liste.",
      tooManyRoles: "Deux rôles au maximum.",
      duplicate: "Ce compte est déjà lié.",
      limitReached: (max: number) =>
        `Ton offre permet de lier ${max} comptes. Retire-en un pour en ajouter un autre.`,
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
