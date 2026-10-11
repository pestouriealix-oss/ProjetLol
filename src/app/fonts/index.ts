import localFont from "next/font/local";

/**
 * Polices de l'interface, hébergées avec le projet (licence SIL OFL, voir les
 * fichiers OFL-*.txt de ce dossier).
 *
 * - Sofia Sans Extra Condensed : titres, navigation, pseudos, grands chiffres.
 * - Atkinson Hyperlegible Next : tout le texte. Dessinée pour être lue d'un
 *   coup d'œil (0 et O, I et l bien distincts), ce qui compte pour une fiche
 *   qu'on lit en dix secondes et pour des Riot ID.
 *
 * Seul le sous-ensemble latin (qui couvre le français) est préchargé ici. Les
 * sous-ensembles latin étendu et cyrillique sont déclarés dans `globals.css`
 * sous le même nom de famille : le navigateur ne les télécharge que si un
 * pseudo en a besoin.
 *
 * Le nom de famille est fixé à la main (et identique au nom de la constante,
 * comme le demande Next.js) pour que `globals.css` puisse s'y rattacher.
 *
 * Les options doivent être des valeurs littérales (Next.js les lit sans
 * exécuter le fichier) : la plage « latin » des sous-ensembles Google Fonts,
 * qui couvre le français, est donc écrite en toutes lettres deux fois.
 */
export const sofiaSansXC = localFont({
  src: "./sofia-sans-extra-condensed-latin.woff2",
  weight: "1 1000",
  display: "swap",
  variable: "--font-display-face",
  declarations: [
    { prop: "font-family", value: "sofiaSansXC" },
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

export const atkinsonNext = localFont({
  src: "./atkinson-hyperlegible-next-latin.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-text-face",
  declarations: [
    { prop: "font-family", value: "atkinsonNext" },
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});
