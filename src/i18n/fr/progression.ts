/** Progression : l'objectif fixé par le coach, vérifié partie après partie, et les tendances. */
export const progression = {
  title: "Progression",
  intro:
    "L'objectif que le coach t'a fixé, vérifié tout seul sur tes parties suivantes, et la courbe de tes chiffres clés.",
  emptyTitle: "Aucune partie pour l'instant",
  emptyBody:
    "Mets ton compte à jour depuis le tableau de bord : tes parties et leurs chiffres apparaîtront ici.",
  metrics: {
    CS_PER_MINUTE: "CS par minute",
    DEATHS: "Morts",
    KILL_PARTICIPATION: "KP",
    VISION_PER_MINUTE: "Vision par minute",
    CONTROL_WARDS: "Pinks achetées",
    DAMAGE_PER_MINUTE: "Dégâts par minute",
  },
  /** La cible en clair : « 6,5 CS par minute », « 4 morts au plus ». */
  target: {
    CS_PER_MINUTE: (value: string) => `${value} CS par minute`,
    DEATHS: (value: string, count: number) => `${value} mort${count > 1 ? "s" : ""} au plus`,
    KILL_PARTICIPATION: (value: string) => `${value} de KP`,
    VISION_PER_MINUTE: (value: string) => `${value} de vision par minute`,
    CONTROL_WARDS: (value: string, count: number) =>
      `${value} pink${count > 1 ? "s" : ""} par partie`,
    DAMAGE_PER_MINUTE: (value: string) => `${value} dégâts par minute`,
  },
  goal: {
    title: "Objectif en cours",
    target: "Cible",
    checkedOn: (role: string) => `Vérifié sur tes parties en ${role}`,
    setBy: (date: string, champion: string) => `Fixé le ${date}, après ta partie sur ${champion}`,
    record: (met: number, total: number) => `Tenu ${met} fois sur ${total}`,
    recordShort: (met: number, total: number) => `${met}/${total}`,
    recordCaption: (total: number) => (total > 1 ? "parties tenues" : "partie tenue"),
    games: "Parties depuis",
    met: "Tenu",
    missed: "Manqué",
    check: (champion: string, date: string, value: string, met: boolean) =>
      `${date}, ${champion} : ${value}, ${met ? "tenu" : "manqué"}`,
    waiting: (role: string) =>
      `Aucune partie en ${role} depuis. Joue, puis mets ton compte à jour : le site vérifiera tout seul.`,
    emptyTitle: "Pas encore d'objectif",
    emptyBody:
      "Écris le bilan d'une partie : le coach y fixe un objectif chiffré, que tu retrouveras ici, vérifié sur les parties suivantes.",
    emptyAction: "Choisir une partie",
    openMatch: "Voir la partie",
  },
  trends: {
    title: "Tes tendances",
    body: (count: number, role: string) =>
      `Tes ${count} dernières parties en ${role}, de la plus ancienne à la plus récente.`,
    role: "Poste",
    average: "Moyenne",
    recent: (value: string) => `5 dernières : ${value}`,
    earlier: (value: string) => `avant : ${value}`,
    better: "en progrès",
    worse: "en recul",
    targetLine: (value: string) => `Cible : ${value}`,
    noRole:
      "Tes courbes apparaîtront avec tes parties de la Faille de l'invocateur, où chaque joueur a un poste.",
    tooFew: (role: string) => `Joue au moins 3 parties en ${role} pour voir tes courbes.`,
    label: (metric: string, count: number, average: string) =>
      `${metric} sur tes ${count} dernières parties, moyenne ${average}`,
    point: (date: string, champion: string, win: boolean, value: string) =>
      `${date}, ${champion} (${win ? "victoire" : "défaite"}) : ${value}`,
    keyboard: "Flèches gauche et droite pour parcourir les parties.",
  },
  history: {
    title: "Objectifs précédents",
    record: (met: number, total: number) =>
      total === 0 ? "Aucune partie vérifiée" : `Tenu ${met} fois sur ${total}`,
    setOn: (date: string) => `Fixé le ${date}`,
  },
  dashboard: {
    title: "Objectif en cours",
    see: "Voir ma progression",
    inviteTitle: "Fixe-toi un objectif",
    inviteBody:
      "Écris le bilan de ta dernière partie : le coach te fixe un objectif chiffré, vérifié sur les suivantes.",
    inviteAction: "Écrire le bilan",
  },
} as const;
