import { APP_NAME } from "@/lib/config";

/** Page Premium et paiement. */
export const premium = {
  title: "Premium",
  headline: "Plus de coach, pour le prix d'un café",
  lede: `Tout ${APP_NAME} reste gratuit. Premium lève les limites pour ceux qui enchaînent les parties.`,
  perMonth: "par mois",
  perYear: "par an",
  noCommitment: "Sans engagement, résiliable en deux clics.",
  interval: {
    legend: "Durée",
    month: "Au mois",
    year: "À l'année",
    saving: (percent: number) => `−${percent} %`,
  },
  yearlyNote: (perMonth: string) =>
    `Soit ${perMonth} par mois. Payé une fois par an, résiliable quand tu veux : Premium reste actif jusqu'à la fin de l'année payée.`,
  founder: {
    badge: "Fondateur",
    priceLock: (price: string, publicPrice: string) =>
      `Tu étais là avant l'ouverture : ${price} par mois au lieu de ${publicPrice}, garantis tant que ton abonnement court.`,
  },
  trial: {
    title: (date: string) => `Premium t'est offert jusqu'au ${date}`,
    body: "Rien à payer d'ici là, et aucune carte demandée. Pour garder Premium ensuite, abonne-toi quand tu veux : sinon, tu repasses simplement à l'offre gratuite.",
  },
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
} as const;
