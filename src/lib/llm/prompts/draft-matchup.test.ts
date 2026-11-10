import { describe, expect, it } from "vitest";

import { formatInteger, formatPercent } from "@/lib/format";

import { draftMatchupCorrection, draftMatchupMessage, type MatchupRequest } from "./draft-matchup";

const base: MatchupRequest = {
  patch: "16.20",
  ddragonVersion: "16.20.1",
  role: "JUNGLE",
  mine: "Lee Sin",
  theirs: "Ivern",
  partners: null,
  champions: {
    mine: {
      name: "Lee Sin",
      passive: { name: "Rafale", text: "Gagne de la vitesse d'attaque." },
      spells: [
        { key: "Q", name: "Onde sonore", cooldown: "11/10/9/8/7", text: "Projectile.", maxRank: 5 },
        { key: "W", name: "Rempart", cooldown: "12", text: "Bouclier.", maxRank: 5 },
        { key: "R", name: "Rage du dragon", cooldown: "110/85/60", text: "Repousse.", maxRank: 3 },
      ],
    },
    theirs: null,
  },
  stats: {
    patch: "16.20",
    matches: 3141,
    duel: { games: 790, wins: 445 },
    reliable: true,
    mineAtRole: { games: 1577, wins: 836 },
    theirsAtRole: null,
  },
};

describe("draftMatchupMessage", () => {
  it("donne au modèle la fiche technique et les statistiques vérifiées", () => {
    const message = draftMatchupMessage(base);
    expect(message).toContain("Données vérifiées (Data Dragon 16.20.1)");
    // Touches AZERTY, champion nommé, et aucun nom de compétence.
    expect(message).toContain("- A de Lee Sin (délai 11/10/9/8/7 s) : Projectile.");
    expect(message).toContain("- Z de Lee Sin (délai 12 s) : Bouclier.");
    expect(message).toContain(
      "- R de Lee Sin, ultime, débloqué au niveau 6, puis rangs aux niveaux 11 et 16 (délai 110/85/60 s)",
    );
    expect(message).not.toContain("Onde sonore");
    expect(message).not.toContain("Rafale");
    expect(message).toContain("Ivern : fiche technique indisponible.");
    expect(message).toContain(`${formatInteger(3141)} parties classées analysées`);
    expect(message).toContain(
      `${formatPercent(445 / 790)} de victoires pour Lee Sin sur 790 parties (fiable)`,
    );
  });

  it("dit clairement quand il n'y a pas de statistique", () => {
    expect(draftMatchupMessage({ ...base, stats: null })).toContain(
      "Aucune statistique de parties classées disponible",
    );
    const thin = draftMatchupMessage({
      ...base,
      stats: { ...base.stats!, duel: { games: 12, wins: 7 }, reliable: false },
    });
    expect(thin).toContain("peu fiable");
  });

  it("ne parle que du duel, avec le duo en bas", () => {
    const solo = draftMatchupMessage(base);
    expect(solo).not.toContain("En bas");
    const bot = draftMatchupMessage({
      ...base,
      role: "ADC",
      mine: "Caitlyn",
      theirs: "Kog'Maw",
      partners: { mine: "Lux", theirs: "Lulu" },
    });
    expect(bot).toContain("le duo du joueur est Caitlyn avec Lux ; en face, Kog'Maw avec Lulu");
  });

  it("dit comment se joue la voie", () => {
    expect(draftMatchupMessage(base)).toContain("Jungle : pas de voie.");
    expect(draftMatchupMessage({ ...base, role: "MID", mine: "Ahri", theirs: "Zed" })).toContain(
      "Voie seule : Ahri contre Zed, en un contre un. Le joueur n'a ni allié de voie ni support.",
    );
  });

  it("signale un ultime pris dès le niveau 1, et élide devant une voyelle", () => {
    const message = draftMatchupMessage({
      ...base,
      champions: {
        mine: {
          name: "Elise",
          passive: { name: "Reine araignée", text: "Invoque des araignées." },
          spells: [
            {
              key: "R",
              name: "Forme d'araignée",
              cooldown: "4",
              text: "Change de forme.",
              maxRank: 4,
            },
          ],
        },
        theirs: null,
      },
    });
    expect(message).toContain("- Passif d'Elise : Invoque des araignées.");
    expect(message).toContain("- R d'Elise, disponible dès le niveau 1, 4 rangs (délai 4 s)");
  });

  it("redonne le message avec les erreurs à corriger", () => {
    const correction = draftMatchupCorrection("Message.", ["Erreur une.", "Erreur deux."]);
    expect(correction).toBe(
      "Message.\n\nUn premier jet de ce duel contenait des erreurs. Réécris tout le duel en les corrigeant, sans en introduire d'autres :\n- Erreur une.\n- Erreur deux.",
    );
  });
});
