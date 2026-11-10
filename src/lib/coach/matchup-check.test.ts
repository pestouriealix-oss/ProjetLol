import { describe, expect, it } from "vitest";

import type { Matchup } from "@/lib/llm/prompts/draft-matchup";
import type { ChampionSheet } from "@/lib/llm/prompts/shared";

import { matchupIssues, type MatchupContext } from "./matchup-check";

const orianna: ChampionSheet = {
  name: "Orianna",
  passive: {
    name: "Remontage",
    text: "Ses attaques infligent des dégâts magiques supplémentaires.",
  },
  spells: [
    {
      key: "Q",
      name: "Commande : Attaque",
      cooldown: "6/5.25/4.5/3.75/3",
      text: "La sphère file vers une cible.",
      maxRank: 5,
    },
    {
      key: "W",
      name: "Commande : Dissonance",
      cooldown: "7",
      text: "Une impulsion autour de la sphère.",
      maxRank: 5,
    },
    {
      key: "E",
      name: "Commande : Protection",
      cooldown: "9",
      text: "La sphère se fixe sur un allié et le protège.",
      maxRank: 5,
    },
    {
      key: "R",
      name: "Commande : Onde de choc",
      cooldown: "110/95/80",
      text: "Attire les ennemis vers la sphère après 0,5 seconde.",
      maxRank: 3,
    },
  ],
};

const katarina: ChampionSheet = {
  name: "Katarina",
  passive: { name: "Voracité", text: "Un kill réduit ses délais de récupération." },
  spells: [
    {
      key: "Q",
      name: "Lame rebondissante",
      cooldown: "11/10/9/8/7",
      text: "Lance une dague.",
      maxRank: 5,
    },
    {
      key: "W",
      name: "Préparation",
      cooldown: "15/14/13/12/11",
      text: "Lance une dague en l'air.",
      maxRank: 5,
    },
    {
      key: "E",
      name: "Shunpo",
      cooldown: "14/12.5/11/9.5/8",
      text: "Se téléporte près d'une cible.",
      maxRank: 5,
    },
    {
      key: "R",
      name: "Lotus mortel",
      cooldown: "90/60/45",
      text: "Lance des dagues pendant 2,5 secondes.",
      maxRank: 3,
    },
  ],
};

const context: MatchupContext = {
  role: "MID",
  sheets: [orianna, katarina],
  allowed: ["Orianna", "Katarina"],
  roster: ["Ahri", "Katarina", "Lux", "Maître Yi", "Orianna", "Vi", "Zed"],
};

const matchup = (overrides: Partial<Matchup>): Matchup => ({
  verdict: "unfavorable",
  summary: "Katarina domine avant tes objets, toi après.",
  keyMoments: "Niveau 6 : le R de Katarina et le tien changent tout.",
  options: [
    { title: "Jouer à distance", detail: "Touche-la avec ton A sans t'exposer." },
    { title: "Jouer le lead", detail: "Prends l'avantage au farm." },
  ],
  watchOut: "Une fois ton E utilisé, elle te bondit dessus.",
  ...overrides,
});

describe("contrôle du texte de duel", () => {
  it("laisse passer un texte juste", () => {
    expect(
      matchupIssues(
        matchup({
          keyMoments:
            "Niveau 6 : le R de Katarina et ton R (délai 110 s au rang 1) changent les combats. Son E revient en 14 s au rang 1, moins après un kill.",
        }),
        context,
      ),
    ).toEqual([]);
  });

  it("attrape les erreurs de la fiche Orianna contre Katarina", () => {
    const issues = matchupIssues(
      {
        verdict: "unfavorable",
        summary:
          "Katarina prend l'avantage dès qu'elle peut enchaîner Shunpo et Lame rebondissante sur ton Orianna, et ton jeu n'est fort qu'une fois ta sphère posée et le lead tenu.",
        keyMoments:
          "Niveau 6 : Lotus mortel d'Orianna et de Katarina change la donne, et Katarina peut revenir en force dès qu'un kill lui réduit ses délais. Niveau 9 : l'Onde de choc d'Orianna (délai 110 s au rang 1) devient une vraie menace de teamfight si tu l'as en main. Dès le niveau 2, garde ta sphère sur ton allié de voie pour éviter le Shunpo sur toi.",
        options: [
          {
            title: "Jouer la sphère à distance",
            detail:
              "Garde la sphère sur ta Q et ta W pour toucher Katarina sans t'exposer, puis réinitialise ta position avec E sur ton allié dès qu'elle se rapproche.",
          },
          {
            title: "Défendre avec la sphère",
            detail:
              "Pose ta sphère sur ton allié de voie avec E pour gagner armure et résistance magique, puis attends le trade pour punir ses dagues.",
          },
        ],
        watchOut:
          "Ne reste jamais seule à portée de Shunpo : une fois ton E utilisé, Katarina te bondit dessus et tu perds ton trade.",
      },
      context,
    );
    const all = issues.join("\n");
    expect(all).toContain("« Shunpo » est le nom du E de Katarina");
    expect(all).toContain("« Lame rebondissante » est le nom du A de Katarina");
    expect(all).toContain("« Lotus mortel » est le nom du R de Katarina");
    expect(all).toContain("« Commande : Onde de choc » est le nom du R d'Orianna");
    expect(all).toContain("ni allié de voie ni support");
    expect(all).toContain("A au lieu de Q, Z au lieu de W");
  });

  it("refuse un ultime au mauvais niveau, pas un sort de base", () => {
    expect(
      matchupIssues(
        matchup({ keyMoments: "Niveau 9 : le R d'Orianna devient une menace." }),
        context,
      ),
    ).toEqual([expect.stringContaining("« niveau 9 » ne colle pas")]);
    expect(
      matchupIssues(matchup({ keyMoments: "Son ultime au niveau 7 change tout." }), context),
    ).toHaveLength(1);
    expect(
      matchupIssues(
        matchup({ keyMoments: "Au niveau 9, ton A est au maximum ; son R monte au niveau 11." }),
        context,
      ),
    ).toEqual([]);
  });

  it("refuse un délai absent des données, un pourcentage, un champion hors du duel", () => {
    const issues = matchupIssues(
      matchup({
        keyMoments: "Son E revient en 4 s. Elle gagne 55 % de ses duels, comme Zed.",
      }),
      context,
    );
    expect(issues.join("\n")).toContain("« 4 s » ne figure pas");
    expect(issues.join("\n")).toContain("Aucun pourcentage");
    expect(issues.join("\n")).toContain("Zed ne joue pas ce duel");
    // Une durée des descriptions est permise (2,5 secondes du R de Katarina).
    expect(matchupIssues(matchup({ watchOut: "Son R dure 2,5 s : coupe-le." }), context)).toEqual(
      [],
    );
  });

  it("ne confond pas un nom du duel avec un autre champion", () => {
    expect(
      matchupIssues(matchup({ summary: "Maître Yi gagne au niveau 6." }), {
        ...context,
        allowed: ["Maître Yi", "Katarina"],
      }),
    ).toEqual([]);
  });

  it("accepte le duo en bas, pas d'allié de voie en jungle", () => {
    expect(
      matchupIssues(matchup({ summary: "Ton support Lux tient la voie." }), {
        ...context,
        role: "ADC",
        allowed: ["Orianna", "Katarina", "Lux", "Vi"],
      }),
    ).toEqual([]);
    expect(
      matchupIssues(matchup({ summary: "Aide ton allié de voie." }), {
        ...context,
        role: "JUNGLE",
      }),
    ).toHaveLength(1);
  });
});
