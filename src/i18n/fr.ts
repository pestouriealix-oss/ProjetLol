import { APP_NAME } from "@/lib/config";

/**
 * Tous les textes de l'interface. Aucun composant ne contient de texte en dur :
 * une traduction se fera en ajoutant un fichier jumeau de celui-ci.
 */
export const fr = {
  nav: {
    dashboard: "Tableau de bord",
    dashboardShort: "Accueil",
    newGame: "Nouvelle game",
    newGameShort: "Game",
    matches: "Parties",
    news: "Actus",
    esport: "Esport",
    stats: "Stats",
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
      "Ta draft arrive toute seule, ta fiche se lit en dix secondes. Après la partie, le coach te dit ce qui a marché et quoi travailler à la suivante.",
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
    forgotLink: "Mot de passe oublié ?",
    forgot: {
      title: "Mot de passe oublié",
      intro:
        "Donne l'adresse de ton compte : on t'envoie un lien pour choisir un nouveau mot de passe.",
      submit: "Recevoir le lien",
      sent: "Si un compte utilise cette adresse, un e-mail vient de partir. Pense à regarder dans les indésirables.",
      back: "Revenir à la connexion",
    },
    reset: {
      title: "Nouveau mot de passe",
      password: "Nouveau mot de passe",
      submit: "Enregistrer le mot de passe",
      invalid: "Ce lien a expiré ou a déjà servi. Demande-en un nouveau.",
      again: "Demander un nouveau lien",
      done: "Mot de passe changé. Connecte-toi avec le nouveau.",
    },
    verify: {
      title: "Confirme ton adresse",
      intro: "Un clic, et le coach est débloqué.",
      submit: "Confirmer mon adresse",
      done: "Adresse confirmée. Le coach est à toi.",
      invalid:
        "Ce lien a expiré ou a déjà servi. Tu peux en recevoir un nouveau depuis le bandeau de l'application.",
      toDashboard: "Aller au tableau de bord",
    },
    verifyBanner: {
      body: (email: string) =>
        `Confirme ton adresse : on a envoyé un lien à ${email}. Sans ça, le coach reste fermé.`,
      resend: "Renvoyer l'e-mail",
      resent: "E-mail renvoyé.",
      tooMany: "Déjà renvoyé plusieurs fois. Réessaie dans une heure.",
      failed: "L'e-mail n'a pas pu partir. Réessaie dans un instant.",
    },
    errors: {
      invalidCredentials: "E-mail ou mot de passe incorrect.",
      emailTaken: "Un compte existe déjà avec cet e-mail. Connecte-toi à la place.",
      emailInvalid: "Saisis une adresse e-mail valide.",
      passwordTooShort: "Le mot de passe doit faire au moins 8 caractères.",
      passwordTooLong: "Le mot de passe ne peut pas dépasser 128 caractères.",
      nameTooLong: "Le pseudo ne peut pas dépasser 32 caractères.",
      oauth: "La connexion avec Discord a échoué. Réessaie.",
      unknown: "La connexion a échoué. Réessaie dans un instant.",
      unavailable: "Le service ne répond pas pour l'instant. Réessaie dans un instant.",
      tooManyAttempts: "Trop de tentatives. Réessaie dans quelques minutes.",
    },
    howItWorks: {
      title: "Comment ça marche",
      steps: [
        {
          when: "Écran de chargement",
          title: "Ta draft se remplit seule",
          body: `${APP_NAME} récupère les dix champions dès le chargement. En sélection, une capture d'écran suffit : rien à recopier.`,
        },
        {
          when: "Avant la première minute",
          title: "Lis ta fiche",
          body: "Ton duel, comment ton équipe gagne, quand forcer. Plusieurs options : c'est toi qui choisis.",
        },
        {
          when: "Après la partie",
          title: "Reçois ton bilan",
          body: "Tes chiffres face à ton vis-à-vis, ce qui a marché, et un seul objectif à vérifier dès la game suivante.",
        },
      ],
      you: "Toi",
      options: ["Envahir", "Protéger", "Pousser"],
      focus: "Objectif",
    },
    pricing: (sheets: number, reviews: number, price: string) =>
      `Gratuit pour commencer : ${sheets} fiches et ${reviews} bilans par jour. Premium à ${price} par mois, sans engagement.`,
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
    unverified: "Non vérifié",
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
      title: "Champions les plus joués",
      empty: "Tes champions apparaîtront ici, avec ton taux de victoire sur chacun.",
      games: (count: number) => (count === 1 ? "1 partie" : `${count} parties`),
      kda: (ratio: string) => `${ratio} KDA`,
    },
    recent: {
      title: "Dernières parties",
      all: "Tout l'historique",
      empty: "Clique sur « Mettre à jour » : tes parties classées récentes s'afficheront ici.",
    },
  },
  draft: {
    title: "Nouvelle game",
    soon: "Bientôt",
    capture: {
      title: "Colle une capture de ta draft",
      body: "Ctrl + V (ou Cmd + V), dépose l'image ici, ou choisis-la. Fin de sélection des champions ou écran de chargement.",
      choose: "Choisir une image",
      reading: "Lecture de la capture…",
      read: (count: number) =>
        count === 10
          ? "Les dix champions sont placés. Vérifie, puis lance ta fiche."
          : `${count} champion${count > 1 ? "s" : ""} placé${count > 1 ? "s" : ""} sur 10. Clique sur une case vide pour la corriger.`,
      unrecognized: (count: number) =>
        `${count} champion${count > 1 ? "s" : ""} non reconnu${count > 1 ? "s" : ""} : clique sur sa case pour le corriger.`,
      dropHere: "Dépose la capture ici",
      errors: {
        bad_image: "Cette image ne peut pas être lue. Utilise une capture PNG, JPEG ou WebP.",
        not_a_draft:
          "Ce n'est pas une sélection des champions ni un écran de chargement. Essaie une autre capture.",
        too_many: "Trop de captures envoyées en une heure. Réessaie un peu plus tard.",
        missing_key: "La clé de l'API Anthropic n'est pas configurée sur le serveur.",
        invalid_key: "La clé de l'API Anthropic est refusée (révoquée ou sans crédit).",
        rate_limited: "Le service de lecture est très demandé. Réessaie dans une minute.",
        unavailable: "La lecture n'a pas abouti. Réessaie avec une autre capture.",
        refused: "La capture n'a pas pu être analysée. Essaie une autre image.",
        invalid_output: "La lecture a donné un résultat inutilisable. Réessaie.",
        champions_unavailable:
          "La liste des champions ne répond pas pour l'instant. Réessaie dans un instant.",
        invalid_draft: "La draft est incomplète.",
        quota: "Limite atteinte pour aujourd'hui.",
        email_unverified:
          "Confirme d'abord ton adresse e-mail (lien dans le bandeau en haut de la page) pour utiliser le coach.",
      },
    },
    live: {
      title: "Ta partie en cours",
      waiting:
        "Dès que ta partie charge, la draft se remplit toute seule : Riot la donne à l'écran de chargement, pas pendant la sélection.",
      checking: "Recherche de ta partie…",
      found: (riotId: string) =>
        `Draft de ta partie chargée (${riotId}). Vérifie les postes, puis lance ta fiche.`,
      stopped:
        "La recherche automatique s'est arrêtée au bout d'un quart d'heure. Relance-la quand ta partie charge.",
      check: "Vérifier maintenant",
      noAccount: "Lie ton compte Riot : la draft de tes parties se remplira toute seule.",
      settings: "Lier mon compte",
      or: "ou",
      errors: {
        riot_unavailable: "Riot ne répond pas pour l'instant. Utilise une capture en attendant.",
        too_many: "Trop de vérifications en une heure. Utilise une capture en attendant.",
        champions_unavailable:
          "La liste des champions ne répond pas pour l'instant. Réessaie dans un instant.",
        unavailable: "La recherche de ta partie n'a pas abouti. Réessaie dans un instant.",
      } as Partial<Record<string, string>> & { unavailable: string },
    },
    allies: "Ton équipe",
    enemies: "Adversaires",
    you: "Toi",
    slot: "En attente",
    board: {
      caption: "Les champions de la partie, voie par voie",
      role: "Rôle",
      hint: "Une erreur ? Clique sur un champion pour le corriger, ou sur un poste pour dire lequel est le tien.",
      waitingHint: "Le tableau se remplit avec ta partie en cours, ou avec une capture.",
      readOnlyHint: "La draft telle qu'elle a été analysée.",
      choose: (role: string, side: string) =>
        `Choisir le champion ${side === "ours" ? "allié" : "adverse"} au poste ${role}`,
      change: (champion: string) => `${champion}, changer`,
      setMine: (role: string) => `Je joue ${role}`,
      mine: (role: string) => `${role}, ton rôle`,
      duplicate: (champion: string) => `${champion} est présent deux fois.`,
    },
    picker: {
      title: "Choisir un champion",
      search: "Rechercher",
      placeholder: "Nom du champion",
      empty: "Aucun champion ne correspond.",
      clear: "Vider la case",
      close: "Fermer",
    },
    analyse: {
      action: "Écrire ma fiche",
      writing: "Écriture…",
      needs: "Il faut au moins ton champion et ton vis-à-vis.",
      waiting: "La fiche se lance dès que la draft est remplie.",
      remaining: (count: number, limit: number) =>
        `${count} fiche${count > 1 ? "s" : ""} restante${count > 1 ? "s" : ""} sur ${limit} (24 h)`,
      saved: "Fiche enregistrée. Ouvre-la sur ton téléphone pendant le chargement :",
      openSheet: "Ouvrir la fiche",
      again: "Réessayer",
      errors: {
        quota: "Tu as atteint ta limite de fiches pour les dernières 24 heures.",
        budget:
          "Les fiches gratuites sont en pause jusqu'au mois prochain : le coach a atteint son budget mensuel.",
        invalid_draft: "La draft est incomplète ou contient un champion en double.",
        missing_key: "La clé de l'API Anthropic n'est pas configurée sur le serveur.",
        invalid_key: "La clé de l'API Anthropic est refusée (révoquée ou sans crédit).",
        rate_limited: "Le coach est très demandé. Réessaie dans une minute.",
        unavailable: "La fiche n'a pas pu être écrite. Réessaie.",
        refused: "Le coach n'a pas pu répondre pour cette draft.",
        invalid_output: "La fiche reçue était incomplète. Réessaie.",
        champions_unavailable:
          "La liste des champions ne répond pas pour l'instant. Réessaie dans un instant.",
        not_a_draft: "La draft est incomplète.",
        email_unverified:
          "Confirme d'abord ton adresse e-mail (lien dans le bandeau en haut de la page) pour utiliser le coach.",
      },
    },
    noKey: {
      title: "Le coach n'est pas encore branché",
      body: "La clé de l'API Anthropic manque sur le serveur (ANTHROPIC_API_KEY) : la lecture des captures et les fiches sont désactivées.",
    },
    sheet: {
      title: "Ta fiche",
      body: "Elle s'écrira ici dès que tu la lances, en quelques secondes.",
      items: [
        "Comment ton équipe gagne, et comment la leur gagne",
        "Ton matchup en voie, et plusieurs façons de le jouer",
        "Les moments où le rapport de force bascule",
        "Ce qui te fait perdre le duel",
      ],
      win: {
        title: "Conditions de victoire",
        ours: "Vous gagnez",
        theirs: "Ils gagnent",
      },
      matchup: {
        title: (champion: string) => `Ton matchup contre ${champion}`,
        verdict: {
          favorable: "Favorable",
          even: "Équilibré",
          unfavorable: "Défavorable",
        },
        keyMoments: "Moments clés",
        options: "Façons de le jouer",
        option: (index: number) => `Option ${index} : `,
        watchOut: "À surveiller",
        stat: (rate: string, games: string) => `${rate} de victoires sur ${games} parties`,
        statThin: (games: string) =>
          `Seulement ${games} parties pour ce duel : trop peu pour un chiffre fiable`,
        statNone: "Duel pas encore vu dans nos parties analysées",
        statsLevel: "Émeraude et plus",
      },
      sources: {
        title: "Sources",
        stats: (matches: string, patch: string) =>
          `Taux de victoire : ${matches} parties classées Émeraude et plus analysées (API Riot), patch ${patch}.`,
        noStats: "Pas encore de statistiques de parties : aucun pourcentage dans cette fiche.",
        ddragon: (version: string) =>
          `Compétences et délais : Data Dragon ${version} (données officielles de Riot).`,
        coach: "Le reste est l'analyse du coach à partir de ces données.",
      },
      writing: "Le coach écrit ta fiche…",
      patch: (patch: string) => `Patch ${patch}`,
      createdAt: (date: string) => `Écrite ${date}`,
    },
    saved: {
      title: "Fiche de draft",
      back: "Nouvelle game",
      notFound: "Cette fiche n'existe pas ou n'est pas à toi.",
    },
  },
  matches: {
    title: "Parties",
    emptyTitle: "Aucune partie pour l'instant",
    emptyBody:
      "Mets ton compte à jour depuis le tableau de bord : tes parties classées s'afficheront ici, de la plus récente à la plus ancienne.",
    toDashboard: "Aller au tableau de bord",
    win: "Victoire",
    loss: "Défaite",
    queues: { SOLO: "Solo/Duo", FLEX: "Flex", OTHER: "Autre file" },
    kda: (ratio: string) => `${ratio} KDA`,
    cs: (cs: number, perMinute: string) => `${cs} CS (${perMinute}/min)`,
    killParticipation: (percent: string) => `${percent} KP`,
    count: (count: number) => (count === 1 ? "1 partie" : `${count} parties`),
    noAccountBody: "Lie d'abord ton compte Riot pour que tes parties puissent être suivies.",
    noAccountAction: "Lier un compte Riot",
    openDetail: (champion: string, result: string) =>
      `Détail de la partie : ${champion}, ${result}`,
  },
  matchDetail: {
    title: "Détail de la partie",
    rank: {
      unranked: "Non classé",
      hint: "Classement actuel du joueur dans cette file (Riot ne garde pas celui du jour de la partie)",
    },
    back: "Toutes les parties",
    patch: (patch: string) => `Patch ${patch}`,
    ourTeam: "Ton équipe",
    theirTeam: "Adversaires",
    blue: "côté bleu",
    red: "côté rouge",
    you: "Toi",
    unknownPlayer: "Joueur",
    level: (level: number) => `Niveau ${level}`,
    columns: {
      player: "Joueur",
      kda: "KDA",
      damage: "Dégâts",
      gold: "Or",
      cs: "CS",
      vision: "Vision",
      items: "Objets",
    },
    kp: (percent: string) => `${percent} KP`,
    perMinute: (value: string) => `${value}/min`,
    damageShare: (percent: string) => `${percent} de l'équipe`,
    wards: (placed: number, control: number) =>
      `${placed} ward${placed > 1 ? "s" : ""}, ${control} pink${control > 1 ? "s" : ""}`,
    emptySlot: "Emplacement vide",
    trinket: "Bijou",
    spells: "Sorts d'invocateur",
    runes: "Runes",
    objectives: {
      towers: "Tours",
      inhibitors: "Inhibs",
      dragons: "Drakes",
      barons: "Nash",
      heralds: "Hérauts",
      grubs: "Grubs",
      atakhan: "Atakhan",
    },
    score: (kills: number, deaths: number, assists: number) => `${kills} / ${deaths} / ${assists}`,
    gold: (value: string) => `${value} or`,
    review: {
      title: "Bilan du coach",
      intro:
        "Ce qui a marché, ce qui t'a coûté, et comment progresser, d'après les chiffres officiels de la partie.",
      action: "Écrire mon bilan",
      writing: "Écriture…",
      retry: "Réessayer",
      remaining: (count: number, limit: number) =>
        `${count} bilan${count > 1 ? "s" : ""} restant${count > 1 ? "s" : ""} sur ${limit} (24 h)`,
      strengths: "Points forts",
      improvements: "À travailler",
      focus: "Objectif pour la prochaine partie",
      options: "Deux façons d'y arriver",
      option: (index: number) => `Option ${index} : `,
      facts: {
        title: "Les chiffres de la partie",
        lane: (minute: number) => `Face à ton vis-à-vis à ${minute} min`,
        gold: (value: string) => `${value} or`,
        cs: (value: string) => `${value} CS`,
        goldEnd: "Or face à ton vis-à-vis en fin de partie",
        takedowns: "Kills + assists avant 15 min",
        versus: (value: number) => `vis-à-vis : ${value}`,
        objectives: "Objectifs auxquels tu as participé",
        objectivesValue: (dragons: number, barons: number, towers: number) =>
          `${dragons} drake${dragons > 1 ? "s" : ""} · ${barons} nash · ${towers} tour${towers > 1 ? "s" : ""}`,
        deaths: "Morts avant 15 min",
        deathsObjective: (count: number) => `dont ${count} juste avant un objectif adverse`,
        csPerMinute: "CS par minute",
        killParticipation: "Participation aux kills (KP)",
        visionPerMinute: "Vision par minute",
        habit: (value: string) => `habitude : ${value}`,
      },
      sources: (games: number) =>
        games > 0
          ? `D'après les données officielles de la partie (Riot) et tes ${games} autres parties classées à ce poste. Bilan écrit par le coach (Claude).`
          : "D'après les données officielles de la partie (Riot). Bilan écrit par le coach (Claude).",
      notReviewable:
        "Le bilan existe pour les parties de la Faille de l'invocateur, où chaque joueur a un poste.",
      noKey:
        "Le coach n'est pas branché : la clé de l'API Anthropic manque sur le serveur (ANTHROPIC_API_KEY).",
      errors: {
        quota: "Tu as atteint ta limite de bilans pour les dernières 24 heures.",
        budget:
          "Les bilans gratuits sont en pause jusqu'au mois prochain : le coach a atteint son budget mensuel.",
        match_not_found: "Cette partie est introuvable.",
        not_reviewable:
          "Le bilan existe pour les parties de la Faille de l'invocateur, où chaque joueur a un poste.",
        missing_key: "La clé de l'API Anthropic n'est pas configurée sur le serveur.",
        invalid_key: "La clé de l'API Anthropic est refusée (révoquée ou sans crédit).",
        rate_limited: "Le coach est très demandé. Réessaie dans une minute.",
        unavailable: "Le bilan n'a pas pu être écrit. Réessaie.",
        refused: "Le coach n'a pas pu répondre pour cette partie.",
        invalid_output: "Le bilan reçu était incomplet. Réessaie.",
        email_unverified:
          "Confirme d'abord ton adresse e-mail (lien dans le bandeau en haut de la page) pour utiliser le coach.",
      },
    },
    duel: {
      title: "Face à ton vis-à-vis",
      body: (champion: string) => `Toi contre ${champion}, au même poste.`,
      damage: "Dégâts aux champions",
      gold: "Or gagné",
      cs: "CS",
      vision: "Score de vision",
      none: "Riot n'a pas attribué les postes de cette partie : pas de vis-à-vis à comparer.",
    },
    timeline: {
      title: "Chronologie",
      gold: {
        title: "Écart d'or",
        body: "Or de ton équipe moins celui de l'équipe adverse, minute par minute.",
        label: "Écart d'or entre les deux équipes au fil de la partie",
        ahead: (gold: string) => `+${gold} pour ton équipe`,
        behind: (gold: string) => `+${gold} pour l'équipe adverse`,
        even: "Égalité",
        minute: (minute: number) => `${minute} min`,
        keyboard: "Flèches gauche et droite pour parcourir les minutes.",
        table: "Voir les objectifs",
      },
      objectives: {
        dragon: "Drake",
        elder: "Elder",
        baron: "Nash",
        herald: "Héraut",
        grubs: "Grubs",
        atakhan: "Atakhan",
        tower: "Tour",
        inhibitor: "Inhib",
      },
      objectiveShort: {
        dragon: "D",
        elder: "E",
        baron: "N",
        herald: "H",
        grubs: "G",
        atakhan: "A",
        tower: "T",
        inhibitor: "I",
      },
      legend: "Légende des objectifs",
      dragons: {
        FIRE_DRAGON: "infernal",
        WATER_DRAGON: "océanique",
        EARTH_DRAGON: "des montagnes",
        AIR_DRAGON: "des nuages",
        HEXTECH_DRAGON: "hextech",
        CHEMTECH_DRAGON: "chimtech",
      } as Record<string, string>,
      objectiveAt: (name: string, team: string, time: string) => `${name}, ${team}, à ${time}`,
      ours: "ton équipe",
      theirs: "équipe adverse",
      oursLabel: "Ton équipe",
      theirsLabel: "Équipe adverse",
      build: {
        title: "Ordre d'achat",
        empty: "Aucun achat enregistré.",
        at: (time: string) => `À ${time}`,
      },
      skills: {
        title: "Ordre des compétences",
        empty: "Aucune compétence enregistrée.",
        level: (level: number) => `Niveau ${level}`,
        keys: ["Q", "W", "E", "R"],
      },
      errors: {
        missing_key: "Chronologie indisponible : la clé de l'API Riot est absente.",
        invalid_key: "Chronologie indisponible : la clé de l'API Riot est refusée ou expirée.",
        rate_limited:
          "Chronologie indisponible pour l'instant : trop de demandes envoyées à Riot. Recharge la page dans une minute.",
        unavailable: "Chronologie indisponible : Riot ne répond pas pour l'instant.",
        not_found: "Riot n'a plus la chronologie de cette partie.",
      },
      loading: "Chargement de la chronologie…",
    },
    unreadableTitle: "Partie illisible",
    unreadableBody:
      "Les données de cette partie sont incomplètes. Relance une mise à jour depuis le tableau de bord.",
  },
  premium: {
    title: "Premium",
    headline: "Plus de coach, pour le prix d'un café",
    lede: `Tout ${APP_NAME} reste gratuit. Premium lève les limites pour ceux qui enchaînent les parties.`,
    perMonth: "par mois",
    noCommitment: "Sans engagement, résiliable en deux clics.",
    compare: {
      feature: "Ce qui change",
      free: "Gratuit",
      premium: "Premium",
      sheets: "Fiches de draft par jour",
      reviews: "Bilans de partie par jour",
      accounts: "Comptes Riot liés",
      everything: "Stats, parties, esport, actus",
      included: "Inclus",
    },
    subscribe: "Passer Premium",
    opening: "Ouverture du paiement…",
    paymentBy: `Paiement sécurisé par Paddle, notre revendeur officiel : il gère la carte et la TVA, ${APP_NAME} ne voit jamais tes coordonnées bancaires.`,
    notReady:
      "Le paiement n'est pas encore ouvert. Premium arrive bientôt : en attendant, profite de l'offre gratuite.",
    loadError: "Le paiement n'a pas pu s'ouvrir. Vérifie ta connexion et réessaie.",
    thanks:
      "Merci ! Ton paiement est en cours de confirmation : Premium s'active dans quelques secondes.",
    active: {
      title: "Tu es Premium",
      renews: (date: string) => `Prochain renouvellement le ${date}.`,
      ends: (date: string) => `Résilié : Premium reste actif jusqu'au ${date}.`,
      pastDue:
        "Le dernier paiement a échoué : mets à jour ton moyen de paiement pour garder Premium.",
      manage: "Gérer mon abonnement",
      manageHint: "Factures, moyen de paiement ou résiliation, sur le portail de Paddle.",
      manageError: "Le portail de paiement ne répond pas. Réessaie dans un instant.",
    },
    upsell: "Passer Premium",
  },
  settings: {
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
  },
  news: {
    title: "Actus",
    intro:
      "La scène et le jeu en articles, en français et en anglais, et les patchs avec leurs notes officielles.",
    views: {
      label: "Contenu",
      articles: "Articles",
      patches: "Patchs",
    },
    languages: {
      label: "Langue des articles",
      all: "Toutes",
      fr: "Français",
      en: "Anglais",
    },
    articles: {
      title: "Derniers articles",
      readOn: (source: string) => `Lire sur ${source}`,
      opensOn: (source: string) => `S'ouvre sur ${source}`,
      langTag: { fr: "FR", en: "EN" },
      emptyTitle: "Rien de neuf pour l'instant",
      emptyBody:
        "Les sites suivis n'ont rien publié sur League of Legends ces deux dernières semaines.",
      emptyLanguageTitle: "Rien de neuf dans cette langue pour l'instant",
      emptyLanguageBody: "Les articles dans les autres langues restent disponibles.",
      showAll: "Voir toutes les langues",
      errorTitle: "Les articles n'ont pas pu être chargés",
      errorBody:
        "Les sites d'actualité ne répondent pas pour l'instant. Réessaie dans quelques minutes.",
      partial: (sources: string, count: number) =>
        count > 1
          ? `${sources} ne répondent pas pour l'instant : leurs articles manquent.`
          : `${sources} ne répond pas pour l'instant : ses articles manquent.`,
      credit:
        "Titres et extraits viennent des flux RSS des sites et de Google Actualités. Chaque article se lit en entier chez son auteur.",
    },
    current: "Patch actuel",
    readNotes: "Lire les notes de patch",
    notesFor: (id: string) => `Notes du patch ${id}`,
    previous: "Patchs précédents",
    opensRiot: "S'ouvre sur le site de League of Legends",
    errorTitle: "La liste des patchs n'a pas pu être chargée",
    errorBody:
      "Les serveurs de Riot ne répondent pas pour l'instant. Les liens officiels restent disponibles.",
    emptyTitle: "Aucun patch à afficher",
    official: {
      title: "Sources officielles",
      links: [
        {
          label: "Toutes les notes de patch",
          href: "https://www.leagueoflegends.com/fr-fr/news/tags/patch-notes/",
        },
        { label: "Actualités du jeu", href: "https://www.leagueoflegends.com/fr-fr/news/" },
        { label: "État des serveurs", href: "https://status.riotgames.com/lol?locale=fr_FR" },
        { label: "Compétition (LoL Esports)", href: "https://lolesports.com/fr-FR/" },
      ],
    },
  },
  stats: {
    title: "Statistiques",
    intro: "Tes parties classées synchronisées, champion par champion et rôle par rôle.",
    queue: "File",
    queues: { ALL: "Toutes les classées", SOLO: "Solo/Duo", FLEX: "Flex" },
    lp: {
      title: "Évolution du classement",
      body: "Un point à chaque changement de rang relevé lors d'une mise à jour.",
      empty:
        "La courbe apparaîtra après quelques mises à jour de ton compte, à mesure que ton rang évolue.",
      noRankQueue: "Choisis Solo/Duo ou Flex pour voir l'évolution du classement.",
      label: "Évolution du classement, du premier au dernier relevé",
      point: (date: string, rank: string, lp: number) => `${date} : ${rank}, ${lp} LP`,
      table: "Voir les relevés",
      date: "Date",
      rank: "Rang",
      keyboard: "Flèches gauche et droite pour parcourir les relevés.",
      change: (value: string) => `${value} LP`,
      changeLabel: (value: string, since: string) => `${value} LP depuis le ${since}`,
    },
    roles: {
      title: "Par rôle",
      unknown: "Poste non attribué",
    },
    champions: {
      title: "Par champion",
      champion: "Champion",
      games: "Parties",
      winrate: "Victoires",
      kda: "KDA",
      csPerMinute: "CS/min",
      damagePerMinute: "Dégâts/min",
      vision: "Vision",
      killParticipation: "KP",
      averageScore: (kills: string, deaths: string, assists: string) =>
        `${kills} / ${deaths} / ${assists}`,
    },
    matchups: {
      title: "Face à quels champions",
      body: "Ton bilan contre le champion adverse à ton poste, à partir de deux parties.",
      worst: "Tes vis-à-vis les plus durs",
      best: "Ceux qui te réussissent",
      empty: "Pas encore assez de parties contre les mêmes champions.",
      record: (wins: number, games: number) => `${wins} V sur ${games}`,
    },
    games: (count: number) => (count === 1 ? "1 partie" : `${count} parties`),
    /** Bilan brut, montré à la place du pourcentage tant qu'il y a trop peu de parties. */
    record: (wins: number, losses: number) => `${wins} V – ${losses} D`,
    smallSample: (wins: number, losses: number) =>
      `${wins} victoire${wins > 1 ? "s" : ""}, ${losses} défaite${losses > 1 ? "s" : ""} : trop peu de parties pour un pourcentage`,
    emptyTitle: "Pas encore de statistiques",
    emptyBody:
      "Mets ton compte à jour depuis le tableau de bord : tes statistiques se calculent à partir de tes parties classées.",
    seeAll: "Toutes les stats",
  },
  live: {
    title: "Partie en cours",
    open: "Partie en cours",
    banner: "Tu es en partie en ce moment.",
    bannerAction: "Voir la partie",
    loading: "Chargement de la partie…",
    notInGameTitle: "Pas de partie en cours",
    notInGameBody: (riotId: string) =>
      `${riotId} n'est pas en partie pour l'instant. Lance une game, puis reviens ici dès l'écran de chargement.`,
    notInGamePreview: "Ce que tu verras ici :",
    notInGameItems: [
      "les dix joueurs, avec leur rang officiel et leur bilan de la saison ;",
      "leurs sorts d'invocateur et leurs runes ;",
      "les bannissements, et la durée de la partie en direct.",
    ],
    notInGameDraft:
      "Pour ta fiche, ouvre plutôt Nouvelle game avant de lancer : la draft s'y remplit toute seule au chargement.",
    toDraft: "Préparer ma fiche",
    refresh: "Vérifier à nouveau",
    unverifiedTitle: "Compte pas encore vérifié",
    unverifiedBody: `Mets d'abord ton compte à jour depuis le tableau de bord : ${APP_NAME} a besoin de l'identifiant Riot du joueur.`,
    toDashboard: "Aller au tableau de bord",
    noAccountBody: "Lie d'abord ton compte Riot pour suivre tes parties en direct.",
    elapsed: "Durée",
    loadingScreen: "Écran de chargement",
    ourTeam: "Ton équipe",
    theirTeam: "Adversaires",
    blue: "côté bleu",
    red: "côté rouge",
    you: "Toi",
    bans: "Bannissements",
    unranked: "Non classé",
    hiddenPlayer: "Joueur masqué",
    bot: "Bot",
    rank: (label: string, lp: number) => `${label} · ${lp} LP`,
    record: (winrate: string, games: number) => `${winrate} sur ${games} parties`,
    queues: {
      0: "Partie personnalisée",
      400: "Normale (draft)",
      420: "Classée Solo/Duo",
      430: "Normale (aveugle)",
      440: "Classée Flex",
      450: "ARAM",
      490: "Partie rapide",
      1700: "Arena",
      1900: "URF",
    } as Record<number, string>,
    otherQueue: "Autre mode",
    errors: {
      missing_key:
        "La synchronisation n'est pas configurée sur ce serveur (clé de l'API Riot absente).",
      invalid_key: "La clé de l'API Riot est refusée ou expirée.",
      rate_limited: "Trop de demandes envoyées à Riot. Réessaie dans une minute.",
      unavailable: "Riot ne répond pas pour l'instant. Réessaie dans quelques minutes.",
      not_found: "Riot ne trouve pas ce joueur.",
    },
    errorTitle: "La partie en cours n'a pas pu être chargée",
  },
  esport: {
    title: "Esport",
    intro: "Les compétitions en cours : calendrier, résultats, arbres et classements.",
    live: "En cours",
    upcoming: "À venir",
    finished: "Terminée",
    dates: (from: string, to: string) => `Du ${from} au ${to}`,
    stages: "Étapes de la compétition",
    pending: {
      standings: "Le classement de cette étape apparaîtra après ses premiers matchs.",
      bracket: "L'arbre de cette étape apparaîtra quand les affiches seront connues.",
    },
    stageNames: {
      "play-in": "Play-in",
      swiss: "Phase suisse",
      knockout: "Phase finale",
      groups: "Phase de groupes",
      regular: "Saison régulière",
      playoffs: "Phase finale",
    } as Record<string, string>,
    bracket: {
      single: "Arbre",
      upper: "Tableau des gagnants",
      lower: "Tableau des perdants",
      final: "Grande finale",
      round: (n: number) => `Tour ${n}`,
      quarterfinals: "Quarts de finale",
      semifinals: "Demi-finales",
      finals: "Finale",
      scroll: "Fais défiler l'arbre sur le côté pour voir la suite.",
    },
    swiss: {
      title: "Bilans",
      body: "Trois victoires pour se qualifier, trois défaites pour être éliminé.",
      qualified: "Qualifiées",
      eliminated: "Éliminées",
      record: (wins: number, losses: number) => `${wins}–${losses}`,
    },
    standings: {
      title: "Classement",
      rank: "Rang",
      team: "Équipe",
      record: "V–D",
    },
    schedule: {
      title: "Calendrier et résultats",
      empty: "Pas encore de match programmé pour cette étape.",
      today: "Aujourd'hui",
      tomorrow: "Demain",
      yesterday: "Hier",
      undated: "Date à venir",
      tbd: "À déterminer",
      bestOf: (games: number) => `BO${games}`,
      live: "En direct",
      canceled: "Annulé",
      watch: "Regarder",
      watchLabel: (match: string) => `Regarder ${match} (nouvel onglet)`,
      versus: (a: string, b: string) => `${a} contre ${b}`,
    },
    others: {
      title: "Autres compétitions",
      empty: "Aucune autre compétition majeure en ce moment.",
    },
    credit: "Données : PandaScore",
    noKeyTitle: "L'onglet Esport n'est pas configuré",
    noKeyBody:
      "Il faut une clé PandaScore (gratuite) dans le fichier .env du serveur, à la ligne PANDASCORE_TOKEN. Ensuite, relance le serveur.",
    emptyTitle: "Aucune compétition en ce moment",
    emptyBody: "Les grandes compétitions apparaîtront ici dès qu'elles seront programmées.",
    errors: {
      invalid_key: "PandaScore refuse la clé. Vérifie PANDASCORE_TOKEN dans le fichier .env.",
      rate_limited: "Trop de demandes envoyées à PandaScore. Réessaie dans quelques minutes.",
      unavailable: "PandaScore ne répond pas pour l'instant. Réessaie dans quelques minutes.",
      missing_key: "La clé PandaScore est absente.",
    },
    errorTitle: "Les compétitions n'ont pas pu être chargées",
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
  emails: {
    greeting: (name: string | null) => (name ? `Salut ${name},` : "Salut,"),
    linkFallback: "Si le bouton ne marche pas, copie ce lien dans ton navigateur :",
    footer: `Tu reçois cet e-mail parce qu'un compte ${APP_NAME} utilise cette adresse. Si ce n'est pas toi, ignore-le : rien ne se passera.`,
    verify: {
      subject: `Confirme ton adresse ${APP_NAME}`,
      body: "Un clic pour confirmer ton adresse e-mail et débloquer le coach : fiches de draft et bilans de partie.",
      action: "Confirmer mon adresse",
      expiry: "Le lien est valable 48 heures.",
    },
    reset: {
      subject: `Ton nouveau mot de passe ${APP_NAME}`,
      body: "Tu as demandé un nouveau mot de passe. Choisis-le ici :",
      action: "Choisir un nouveau mot de passe",
      expiry:
        "Le lien est valable 30 minutes. Si tu n'as rien demandé, ignore cet e-mail : ton mot de passe ne change pas.",
    },
  },
  legal: {
    navLabel: "Informations légales",
    terms: "Conditions d'utilisation",
    privacy: "Confidentialité",
    notice: "Mentions légales",
    updated: (date: string) => `Dernière mise à jour : ${date}`,
    missing: "À compléter avant l'ouverture",
    contactLine: (email: string) => `Pour toute question : ${email}.`,
    termsSections: (offer: { sheets: number; reviews: number; price: string }) => [
      {
        title: "1. Objet",
        paragraphs: [
          `${APP_NAME} est un service en ligne d'aide au jeu pour League of Legends : statistiques de parties, fiches de draft et bilans de partie écrits par un coach automatique, suivi de l'esport et actualités du jeu. Ces conditions encadrent son utilisation ; créer un compte vaut acceptation.`,
        ],
      },
      {
        title: `2. ${APP_NAME} et Riot Games`,
        paragraphs: [
          `${APP_NAME} n'est ni approuvé ni soutenu par Riot Games. Les données de jeu viennent de l'API officielle de Riot Games et sont utilisées dans le respect de ses règles : aucune estimation de niveau caché (MMR), aucune information que le joueur ne voit pas déjà dans le jeu, plusieurs options proposées plutôt qu'une seule. League of Legends et ses visuels appartiennent à Riot Games.`,
        ],
      },
      {
        title: "3. Ton compte",
        paragraphs: [
          "Il faut avoir au moins 15 ans pour créer un compte, ou l'accord d'un parent. L'abonnement Premium demande d'être majeur ou d'avoir l'accord d'un parent.",
          "Ton compte est personnel. Garde ton mot de passe pour toi : tout ce qui est fait depuis ton compte est réputé fait par toi. Ton adresse e-mail doit être confirmée pour utiliser le coach.",
          "Lier un compte Riot sert à suivre tes parties. Un compte lié par « Se connecter avec Riot » est vérifié comme t'appartenant.",
        ],
      },
      {
        title: "4. Le coach",
        paragraphs: [
          "Les fiches de draft et les bilans de partie sont écrits automatiquement par un modèle d'intelligence artificielle (Claude, d'Anthropic), à partir de données vérifiées : la draft, les données officielles de la partie et nos statistiques. Ils proposent des pistes, jamais des ordres, et peuvent se tromper : à toi de juger.",
          "Le coach ne garantit aucun résultat : ni victoire, ni LP, ni rang.",
        ],
      },
      {
        title: "5. Offre gratuite et Premium",
        paragraphs: [
          `L'essentiel de ${APP_NAME} est gratuit, avec des limites par 24 heures : ${offer.sheets} fiches de draft et ${offer.reviews} bilans de partie. L'application affiche ce qu'il te reste.`,
          `Premium, à ${offer.price} TTC par mois, relève ces limites. Le paiement, la facture, la TVA, le remboursement et le droit de rétractation sont gérés par Paddle (Paddle.com Market Limited), notre revendeur officiel, selon ses conditions de vente, présentées au moment du paiement.`,
          "L'abonnement se renouvelle chaque mois. Tu peux le résilier à tout moment depuis la page Premium : il reste actif jusqu'à la fin du mois déjà payé. Un changement de prix est annoncé au moins 30 jours à l'avance, et tu restes libre de résilier.",
          "Le budget du coach est plafonné chaque mois : s'il est atteint, les fiches et bilans gratuits s'arrêtent jusqu'au mois suivant. Premium n'est pas concerné.",
        ],
      },
      {
        title: "6. Ce qui n'est pas permis",
        paragraphs: ["Pour que le service reste juste pour tout le monde, il est interdit :"],
        items: [
          "d'utiliser des robots ou d'extraire des données en masse ;",
          "de créer plusieurs comptes pour multiplier les fiches gratuites ;",
          "de chercher à contourner les limites, à accéder aux données d'un autre joueur ou à perturber le service ;",
          "de revendre le service ou ce qu'il produit.",
        ],
        after: [
          `En cas de manquement, ${APP_NAME} peut suspendre ou fermer le compte, après t'avoir prévenu, sauf urgence.`,
        ],
      },
      {
        title: "7. Disponibilité et responsabilité",
        paragraphs: [
          `${APP_NAME} est fourni tel quel et évolue régulièrement. Il peut être interrompu pour maintenance ou parce qu'un service dont il dépend ne répond pas (l'API de Riot Games, par exemple). ${APP_NAME} ne peut être tenu responsable d'une partie perdue, de LP perdus ou d'une décision prise en jeu.`,
        ],
      },
      {
        title: "8. Propriété",
        paragraphs: [
          `Le site, son code, ses textes, son design et ses statistiques agrégées appartiennent à ${APP_NAME}. Les fiches et bilans écrits pour toi sont à ton usage personnel.`,
        ],
      },
      {
        title: "9. Fin du compte",
        paragraphs: [
          "Tu peux supprimer ton compte à tout moment depuis les paramètres : tes données sont effacées (voir la politique de confidentialité) et un abonnement en cours est résilié.",
        ],
      },
      {
        title: "10. Changements et droit applicable",
        paragraphs: [
          "Ces conditions peuvent évoluer. Un changement important est annoncé par e-mail ou dans l'application avant de s'appliquer.",
          "Elles sont soumises au droit français. En cas de désaccord, écris-nous d'abord : on cherchera une solution à l'amiable. À défaut, les tribunaux français sont compétents, sans préjudice des règles qui protègent les consommateurs.",
        ],
      },
    ],
    privacySections: [
      {
        title: "Ce que nous enregistrons",
        items: [
          "Ton compte : adresse e-mail, pseudo (facultatif), empreinte de ton mot de passe (jamais le mot de passe lui-même) et date de confirmation de l'adresse. Avec Discord : ton identifiant, ton nom et ton avatar Discord.",
          "Tes comptes Riot liés : Riot ID, serveur, rôles choisis, et les données publiques que l'API de Riot Games donne sur tes parties et ton classement.",
          "Le coach : les drafts, les fiches et les bilans écrits pour toi, et un relevé de la consommation du modèle (pour appliquer les limites). Une capture d'écran envoyée est lue puis oubliée : elle n'est pas conservée.",
          "Premium : les identifiants client et d'abonnement chez Paddle, le statut et les dates de l'abonnement. Jamais tes coordonnées bancaires : elles restent chez Paddle.",
          "La sécurité : des compteurs d'essais de connexion, d'inscription et de demandes de lien, rattachés à une empreinte non réversible de l'adresse e-mail ou de l'adresse IP ; les liens envoyés par e-mail, sous forme d'empreinte, qui expirent en 30 minutes ou 48 heures.",
        ],
      },
      {
        title: "Pourquoi",
        items: [
          "Te fournir le service (compte, suivi des parties, coach, Premium) : c'est l'exécution du contrat.",
          "Protéger le service et ses utilisateurs (limites d'essais, confirmation de l'adresse) : c'est notre intérêt légitime.",
          "Facturer Premium : c'est une obligation légale, assurée par Paddle.",
        ],
        after: ["Pas de publicité ciblée, pas de revente de données, pas de mesure d'audience."],
      },
      {
        title: "Qui les traite pour nous",
        items: [
          "Vercel (hébergement du site, États-Unis).",
          "Neon (base de données, hébergée en Europe, à Francfort).",
          "Anthropic (modèle Claude) : reçoit la draft, la capture ou les chiffres de la partie à commenter, jamais ton adresse e-mail.",
          "Resend (envoi des e-mails) : reçoit ton adresse e-mail et le lien à envoyer.",
          "Paddle (paiement de Premium).",
          "Riot Games (source des données de jeu, et connexion avec Riot si tu l'utilises), Discord (si tu te connectes avec Discord).",
        ],
        after: [
          "Certains sont établis aux États-Unis : ces transferts reposent sur le cadre de protection des données entre l'Union européenne et les États-Unis, ou sur les clauses contractuelles types de la Commission européenne.",
        ],
      },
      {
        title: "Combien de temps",
        paragraphs: [
          "Tes données sont gardées tant que ton compte existe. Quand tu le supprimes, tout ce qui te concerne est effacé aussitôt, sauf ce que Paddle doit conserver pour la facturation. Un compte inactif depuis trois ans pourra être supprimé, après t'avoir prévenu.",
          "Les parties brutes (données publiques de Riot Games, partagées entre joueurs) et les statistiques agrégées ne contiennent rien qui t'identifie.",
        ],
      },
      {
        title: "Cookies",
        paragraphs: [
          "Un seul cookie te concerne en permanence : celui de ta session, indispensable pour rester connecté. Un cookie temporaire protège la connexion avec Riot. Au moment du paiement, Paddle peut déposer ses propres cookies, nécessaires à la transaction et à la lutte contre la fraude. Aucun cookie de publicité ni de mesure d'audience : il n'y a rien à accepter.",
        ],
      },
      {
        title: "Sécurité",
        paragraphs: [
          "Les mots de passe sont hachés (scrypt), les échanges chiffrés (HTTPS), les clés d'accès aux services restent sur le serveur, et chaque requête ne lit que les données de son utilisateur.",
        ],
      },
      {
        title: "Tes droits",
        paragraphs: [
          "Tu peux accéder à tes données, les corriger, les récupérer, t'opposer à un traitement ou en demander la limitation, et les effacer (la suppression du compte, dans les paramètres, le fait tout de suite). Écris-nous : on répond sous un mois.",
          "Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la CNIL (cnil.fr).",
        ],
      },
    ],
    noticeSections: {
      publisher: "Éditeur",
      director: "Directeur de la publication",
      contact: "Contact",
      contactLabel: "Contact :",
      host: "Hébergement",
      hostBody:
        "Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vercel.com). Base de données : Neon, hébergée en Europe (Francfort).",
      riot: "Riot Games",
    },
  },
} as const;

export const t = fr;
