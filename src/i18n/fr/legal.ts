import { APP_NAME } from "@/lib/config";

/** Pages légales. */
export const legal = {
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
        "Ton compte : adresse e-mail, pseudo (facultatif), empreinte de ton mot de passe (jamais le mot de passe lui-même) et date de confirmation de l'adresse, et le code d'invitation utilisé pendant le test fermé. Avec Discord : ton identifiant, ton nom et ton avatar Discord.",
        "Tes comptes Riot liés : Riot ID, serveur, rôles choisis, et les données publiques que l'API de Riot Games donne sur tes parties et ton classement.",
        "Le coach : les drafts, les fiches et les bilans écrits pour toi, et un relevé de la consommation du modèle (pour appliquer les limites). Une capture d'écran envoyée est lue puis oubliée : elle n'est pas conservée.",
        "La liste d'attente du test fermé : ton adresse e-mail, la date de ton inscription et de ton accord, d'où tu viens (le lien d'un créateur, par exemple) et la date de ton invitation. Rien d'autre.",
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
        "T'écrire depuis la liste d'attente (ton code, puis le lancement) : c'est ton accord, que tu peux retirer à tout moment en nous écrivant.",
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
        "Une adresse de la liste d'attente est effacée dès que tu le demandes, et au plus tard six mois après l'ouverture publique du site.",
        "Les parties brutes (données publiques de Riot Games, partagées entre joueurs) et les statistiques agrégées ne contiennent rien qui t'identifie.",
      ],
    },
    {
      title: "Cookies",
      paragraphs: [
        "Un seul cookie te concerne en permanence : celui de ta session, indispensable pour rester connecté. Un cookie temporaire protège la connexion avec Riot, un autre garde ton code d'invitation le temps d'une inscription avec Discord (15 minutes). Au moment du paiement, Paddle peut déposer ses propres cookies, nécessaires à la transaction et à la lutte contre la fraude. Aucun cookie de publicité ni de mesure d'audience : il n'y a rien à accepter.",
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
} as const;
