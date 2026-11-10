/** Nouvelle game : la draft et la fiche du coach. */
export const draft = {
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
    notOwned:
      "Confirme que ton compte Riot est à toi : la draft de tes parties se remplira toute seule.",
    confirm: "Confirmer mon compte",
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
      unverified:
        "Le coach n'a pas réussi à écrire ce duel sans erreur : il préfère ne rien afficher. Il réessaiera à ta prochaine partie.",
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
} as const;
