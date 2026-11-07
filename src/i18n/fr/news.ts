/** Actus et patchs. */
export const news = {
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
      "Titres et extraits viennent des flux RSS que publient les sites eux-mêmes. Chaque article se lit en entier chez son auteur.",
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
} as const;
