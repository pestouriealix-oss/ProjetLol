/** Statistiques. */
export const stats = {
  title: "Statistiques",
  intro:
    "Tes parties synchronisées sur la Faille de l'invocateur, champion par champion et rôle par rôle.",
  queue: "File",
  queues: { ALL: "Toutes", SOLO: "Solo/Duo", FLEX: "Flex", NORMAL: "Normales" },
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
    "Mets ton compte à jour depuis le tableau de bord : tes statistiques se calculent à partir de tes parties.",
  seeAll: "Toutes les stats",
} as const;
