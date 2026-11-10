/** L'app Overwolf : la liaison avec le compte (site) et les textes de l'app elle-même. */
export const companion = {
  /** Page `/app` du site : valider le code affiché dans l'app. */
  link: {
    title: "Relier l'app Overwolf",
    intro:
      "L'app Gufo pour Overwolf affiche un code. Valide-le ici pour qu'elle prépare tes fiches à l'écran de chargement, avec ton compte.",
    warning:
      "Ne valide que le code affiché dans ton app, sur ton PC. Un code reçu de quelqu'un d'autre lui donnerait accès à ton compte.",
    code: "Code affiché dans l'app",
    codeHint: "Huit caractères, par exemple K7QM-2XPA.",
    approve: "Relier l'app",
    approvedTitle: "L'app est reliée",
    approvedBody:
      "Tu peux retourner dans l'app : elle se met à jour toute seule. Tu pourras couper son accès dans Paramètres.",
    invalid:
      "Ce code ne correspond à aucune app en attente. Il expire au bout de 10 minutes : demandes-en un nouveau dans l'app.",
    tooMany: "Trop d'essais. Attends quelques minutes avant de recommencer.",
    loginFirst: "Connecte-toi à ton compte Gufo, puis valide le code.",
    loginAction: "Se connecter",
    as: (name: string) => `Connecté en tant que ${name}.`,
  },
  /** Section de Paramètres. */
  settings: {
    title: "App Overwolf",
    description:
      "Les apps reliées à ton compte. Couper l'accès déconnecte l'app tout de suite ; tu pourras la relier à nouveau.",
    linkedOn: (date: string) => `Reliée le ${date}`,
    lastUsed: (date: string) => `utilisée le ${date}`,
    revoke: "Couper l'accès",
    revokeLabel: (name: string, date: string) => `Couper l'accès de ${name}, reliée le ${date}`,
  },

  /** Les fenêtres de l'app Overwolf. */
  app: {
    window: { minimize: "Réduire", close: "Fermer", hideSheet: "Masquer la fiche" },
    link: {
      title: "Relie l'app à ton compte Gufo",
      body: "L'app prépare ta fiche de draft à l'écran de chargement, avec ton compte : tes comptes Riot, tes fiches du jour, Premium.",
      start: "Obtenir un code",
      starting: "Demande du code…",
      waitingTitle: "Valide ce code sur gufo.gg",
      waitingBody:
        "La page s'est ouverte dans ton navigateur. Connecte-toi si besoin, puis valide le code : l'app se met à jour toute seule.",
      reopen: "Rouvrir la page",
      cancel: "Annuler",
      expired: "Le code a expiré. Demandes-en un nouveau.",
      retry: "Nouveau code",
      errors: {
        network: "Gufo ne répond pas. Vérifie ta connexion, puis réessaie.",
        rate_limited: "Trop de codes demandés depuis ta connexion. Réessaie dans un moment.",
        server: "Gufo ne répond pas comme prévu. Réessaie dans un instant.",
      },
      noAccount: "Pas encore de compte ?",
      createAccount: "Créer un compte sur gufo.gg",
    },
    account: {
      loading: "Lecture de ton compte…",
      offline: "Gufo ne répond pas pour l'instant.",
      retry: "Réessayer",
      sheetsLeft: (remaining: number, limit: number) =>
        `${remaining} fiche${remaining > 1 ? "s" : ""} sur ${limit} aujourd'hui`,
      unconfirmed: "À confirmer",
      noRiotAccount:
        "Aucun compte Riot lié. Ajoute le tien sur gufo.gg pour que l'app trouve ta partie.",
      notOwned:
        "Prouve que ton compte Riot est à toi sur gufo.gg : le coach ne lit que tes parties.",
      emailUnverified: "Confirme ton adresse e-mail sur gufo.gg pour débloquer le coach.",
      fixOnSite: "Ouvrir mes paramètres",
      logout: "Se déconnecter",
    },
    stage: {
      offline: {
        title: "Lance League of Legends",
        body: "Ta fiche s'ouvre toute seule à l'écran de chargement.",
      },
      lobby: {
        title: "En attente d'une partie",
        body: "Ta fiche s'ouvre toute seule à l'écran de chargement.",
      },
      champ_select: {
        title: "Sélection des champions",
        body: "Ta fiche arrive à l'écran de chargement, dès que Riot montre les dix champions.",
        hovered: "survolé",
      },
      loading: {
        title: "Écran de chargement",
        body: "Ta fiche est là, par-dessus le jeu.",
        show: "Afficher la fiche",
      },
      in_game: {
        title: "Bonne partie",
        body: "La fiche s'efface pendant la partie. Elle t'attend ici et sur gufo.gg.",
      },
      after_game: {
        title: "Partie terminée",
        body: "Ton bilan t'attend sur gufo.gg : ce qui a marché, et un objectif pour la prochaine.",
        action: "Voir mes parties",
      },
    },
    lastSheet: {
      title: "Dernière fiche",
      open: "Ouvrir sur gufo.gg",
      empty: "Ta prochaine fiche apparaîtra ici.",
    },
    settings: {
      title: "Réglages",
      autoShow: "Ouvrir la fiche toute seule à l'écran de chargement",
      hotkey: "Afficher ou masquer la fiche",
      hotkeyNone: "aucun raccourci",
      hotkeyHint: "Tu peux le changer dans les réglages d'Overwolf.",
    },
    sheet: {
      title: "Fiche de draft",
      hideWith: (hotkey: string) => `${hotkey} pour masquer`,
      looking: "Gufo cherche ta partie chez Riot…",
      lookingHint: "Riot la montre quelques secondes après le début du chargement.",
      onSite: "Ta fiche est aussi sur gufo.gg.",
      retry: "Réessayer",
      seePremium: "Voir Premium",
      code: (code: string) => `Code : ${code}`,
      signedOut: {
        title: "App pas encore reliée",
        body: "Ouvre Gufo depuis Overwolf pour relier l'app à ton compte.",
      },
      errors: {
        not_found: {
          title: "Partie introuvable",
          body: "Riot ne montre pas de partie en cours pour tes comptes. Si tu joues sur un autre compte, ajoute-le sur gufo.gg.",
        },
        no_account: {
          title: "Aucun compte Riot lié",
          body: "Ajoute ton compte sur gufo.gg pour que l'app trouve ta partie.",
        },
        not_owned: {
          title: "Compte à confirmer",
          body: "Prouve sur gufo.gg que ce compte est à toi : le coach ne lit que tes parties.",
        },
        email_unverified: {
          title: "Adresse à confirmer",
          body: "Confirme ton adresse e-mail sur gufo.gg pour débloquer le coach.",
        },
        quota: {
          title: "Plus de fiches aujourd'hui",
          body: "Tu as utilisé tes fiches du jour. Premium en donne 40 par jour.",
        },
        budget: {
          title: "Fiches gratuites en pause",
          body: "Les fiches gratuites reprennent le mois prochain. Premium continue.",
        },
        coach_setup: {
          title: "Coach indisponible",
          body: "Le serveur de Gufo n'a pas accès au modèle (clé absente, refusée ou sans crédit). Ce n'est pas de ton côté.",
        },
        busy: {
          title: "Coach débordé",
          body: "Trop de fiches demandées en même temps. Réessaie dans un instant.",
        },
        unavailable: {
          title: "Le coach ne répond pas",
          body: "Réessaie dans un instant.",
        },
      },
    },
  },
} as const;
