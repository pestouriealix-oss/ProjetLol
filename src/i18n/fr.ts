import { APP_NAME } from "@/lib/config";

/**
 * Tous les textes de l'interface. Aucun composant ne contient de texte en dur :
 * une traduction se fera en ajoutant un fichier jumeau de celui-ci.
 */
export const fr = {
  nav: {
    dashboard: "Tableau de bord",
    newGame: "Nouvelle game",
    matches: "Parties",
    settings: "Paramètres",
    main: "Navigation principale",
    accountMenu: "Menu du compte",
    signOut: "Se déconnecter",
  },
  roles: {
    TOP: "Top",
    JUNGLE: "Jungle",
    MID: "Mid",
    ADC: "ADC",
    SUPPORT: "Support",
  },
  plans: {
    FREE: "Gratuit",
    PREMIUM: "Premium",
  },
  auth: {
    headline: "Ton plan de jeu, avant la fin du chargement.",
    pitch:
      "Envoie ta draft, reçois une fiche qui se lit en dix secondes. Après la partie, vois ce qui a marché et ce qui revient trop souvent.",
    loginTitle: "Connexion",
    registerTitle: "Créer un compte",
    email: "E-mail",
    password: "Mot de passe",
    passwordHint: "8 caractères minimum.",
    name: "Pseudo",
    nameHint: "Facultatif. Affiché dans l'application.",
    signIn: "Se connecter",
    signingIn: "Connexion…",
    createAccount: "Créer mon compte",
    creatingAccount: "Création…",
    continueWithDiscord: "Continuer avec Discord",
    or: "ou",
    noAccount: "Pas encore de compte ?",
    hasAccount: "Déjà un compte ?",
    goToRegister: "Créer un compte",
    goToLogin: "Se connecter",
    errors: {
      invalidCredentials: "E-mail ou mot de passe incorrect.",
      emailTaken: "Un compte existe déjà avec cet e-mail. Connecte-toi à la place.",
      emailInvalid: "Saisis une adresse e-mail valide.",
      passwordTooShort: "Le mot de passe doit faire au moins 8 caractères.",
      passwordTooLong: "Le mot de passe ne peut pas dépasser 128 caractères.",
      nameTooLong: "Le pseudo ne peut pas dépasser 32 caractères.",
      oauth: "La connexion avec Discord a échoué. Réessaie.",
      unknown: "La connexion a échoué. Réessaie dans un instant.",
    },
  },
  sample: {
    label: "Exemple de fiche",
    title: "Lee Sin, jungle",
    versus: "contre Lulu, Ivern, Kog'Maw, Sett et Locke",
    winConditions: "Conditions de victoire",
    ours: "Vous",
    theirs: "Eux",
    oursText: "Prendre l'avance tôt et finir avant 30 minutes.",
    theirsText: "Protéger Kog'Maw jusqu'à ses trois objets.",
    powerCurve: "Courbe de puissance",
    powerCurveAlt:
      "Votre équipe est plus forte jusqu'à 25 minutes environ, l'équipe adverse prend ensuite l'avantage.",
    crossover: "Bascule vers 25 min",
    earlyAxis: "Début",
    lateAxis: "Fin de partie",
    plans: "Plans possibles en début de partie",
    planA: "Envahir Ivern",
    planADetail: "Il ne peut pas te dueler. Prends ses camps et les crabes.",
    planB: "Jouer pour le bas",
    planBDetail: "Caitlyn et Lux dominent la voie, Kog'Maw est immobile.",
    threat: "Menace principale",
    threatText: "Kog'Maw protégé. Attends le polymorphe de Lulu avant de plonger.",
  },
  dashboard: {
    title: "Tableau de bord",
    noAccountTitle: "Lie ton compte Riot pour commencer",
    noAccountBody:
      "Tes statistiques et tes bilans se construisent à partir de tes parties classées. Il faut d'abord savoir quel compte suivre.",
    noAccountAction: "Lier un compte Riot",
    noMatchesTitle: "Aucune partie pour l'instant",
    noMatchesBody:
      "La synchronisation des parties n'est pas encore disponible. Ton compte est prêt : tes parties classées apparaîtront ici dès qu'elle le sera.",
  },
  draft: {
    title: "Nouvelle game",
    emptyTitle: "Le coach de draft n'est pas encore disponible",
    emptyBody:
      "Tu pourras bientôt coller une capture de ta sélection des champions et recevoir ta fiche avant le lancement de la partie.",
  },
  matches: {
    title: "Parties",
    emptyTitle: "Aucune partie pour l'instant",
    emptyBody:
      "L'historique de tes parties classées et leurs bilans apparaîtront ici une fois la synchronisation disponible.",
  },
  settings: {
    title: "Paramètres",
    riot: {
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
      adding: "Ajout…",
      remove: "Retirer",
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
      title: "Compte",
      email: "E-mail",
      plan: "Offre",
      signOut: "Se déconnecter",
      dangerTitle: "Supprimer mon compte",
      dangerBody:
        "Supprime ton compte et toutes tes données : comptes Riot liés, analyses, bilans et notes. Cette action est définitive.",
      delete: "Supprimer mon compte",
      deleteTitle: "Supprimer définitivement ton compte ?",
      deleteBody:
        "Toutes tes données seront effacées immédiatement et ne pourront pas être récupérées.",
      deleteConfirm: "Supprimer mon compte",
    },
  },
  common: {
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
  },
  legal: {
    terms: "Conditions d'utilisation",
    privacy: "Confidentialité",
    draftNotice: "Version provisoire. Ce texte sera rédigé avant l'ouverture au public.",
    termsBody: `${APP_NAME} est en cours de développement et n'est pas encore ouvert au public. Les conditions d'utilisation définitives seront publiées ici.`,
    privacyBody: `${APP_NAME} enregistre ton adresse e-mail, les comptes Riot que tu lies, et les données de tes parties fournies par l'API de Riot Games. Tu peux supprimer ton compte et toutes tes données à tout moment depuis les paramètres.`,
  },
} as const;

export const t = fr;
