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
    createAccount: "Créer mon compte",
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
  sheet: {
    demoLabel: "Exemple de fiche",
    replay: "Rejouer",
    champion: "Lee Sin",
    versus: "contre Lulu, Ivern, Kog'Maw, Sett et Locke",
    win: {
      ours: "Vous gagnez",
      oursText: "en prenant l'avance tôt et en finissant avant 30 minutes.",
      theirs: "Ils gagnent",
      theirsText: "en protégeant Kog'Maw jusqu'à ses trois objets.",
    },
    plans: {
      legend: "Plans possibles en début de partie",
      invade: {
        label: "Envahir Ivern",
        steps: ["Il ne peut pas te dueler.", "Prends ses camps et les crabes."],
        map: "Carte du plan. Ton trajet part de ta jungle, traverse la rivière et entre dans la jungle adverse.",
      },
      bot: {
        label: "Ganker le bas",
        steps: ["Caitlyn et Lux dominent la voie.", "Kog'Maw est immobile : punis-le tôt."],
        map: "Carte du plan. Ton trajet part de ta jungle et rejoint la voie du bas.",
      },
    },
    curve: {
      title: "Qui est le plus fort, et quand",
      sliderLabel: "Minute de la partie",
      ours: "Vous",
      theirs: "Eux",
      minute: (minute: number) => `${minute} min`,
      crossover: (minute: number) => `L'avantage bascule vers ${minute} min`,
      advantage: {
        oursClear: "Net avantage pour vous",
        oursSlight: "Léger avantage pour vous",
        even: "Équilibre",
        theirsSlight: "Léger avantage pour eux",
        theirsClear: "Net avantage pour eux",
      },
      phases: {
        early: "Début",
        mid: "Milieu",
        late: "Fin de partie",
      },
    },
    threat: {
      label: "À surveiller",
      text: "Kog'Maw protégé. Attends le polymorphe de Lulu avant de plonger.",
    },
  },
  dashboard: {
    title: "Tableau de bord",
    accounts: "Compte affiché",
    manage: "Gérer les comptes",
    noRoles: "Aucun rôle choisi",
    syncSoon: "Synchronisation bientôt disponible",
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
      solo: "Solo/Duo",
      flex: "Flex",
      pending: "Pas encore synchronisé",
    },
    champions: {
      title: "Champions les plus joués",
      empty: "Tes champions apparaîtront ici, avec ton taux de victoire sur chacun.",
    },
    recent: {
      title: "Dernières parties",
      all: "Tout l'historique",
    },
  },
  draft: {
    title: "Nouvelle game",
    soon: "Bientôt",
    capture: {
      title: "Colle une capture de ta sélection des champions",
      body: "Ctrl + V, ou dépose l'image ici. Les dix champions seront reconnus et placés dans le tableau.",
    },
    allies: "Ton équipe",
    enemies: "Adversaires",
    you: "Toi",
    slot: "En attente",
    sheet: {
      title: "Ta fiche",
      body: "Elle s'écrira ici pendant le chargement de la partie.",
      items: [
        "Comment ton équipe gagne, et comment la leur gagne",
        "Plusieurs plans de début de partie, tracés sur la carte",
        "Qui est le plus fort, et à quel moment",
        "Le danger principal à surveiller",
      ],
    },
  },
  matches: {
    title: "Parties",
    emptyTitle: "Aucune partie pour l'instant",
    emptyBody:
      "La synchronisation n'est pas encore disponible. Tes parties classées s'afficheront ici, de la plus récente à la plus ancienne, chacune avec son bilan.",
    noAccountBody: "Lie d'abord ton compte Riot pour que tes parties puissent être suivies.",
    noAccountAction: "Lier un compte Riot",
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
    navLabel: "Informations légales",
    terms: "Conditions d'utilisation",
    privacy: "Confidentialité",
    draftNotice: "Version provisoire. Ce texte sera rédigé avant l'ouverture au public.",
    termsBody: `${APP_NAME} est en cours de développement et n'est pas encore ouvert au public. Les conditions d'utilisation définitives seront publiées ici.`,
    privacyBody: `${APP_NAME} enregistre ton adresse e-mail, les comptes Riot que tu lies, et les données de tes parties fournies par l'API de Riot Games. Tu peux supprimer ton compte et toutes tes données à tout moment depuis les paramètres.`,
  },
} as const;

export const t = fr;
