import { describe, expect, it } from "vitest";

import { formatInteger, formatPercent } from "@/lib/format";

import { draftSheetMessage, type SheetRequest } from "./draft-sheet";

const base: SheetRequest = {
  patch: "16.20",
  ddragonVersion: "16.20.1",
  myRole: "JUNGLE",
  allies: { TOP: "Garen", JUNGLE: "Lee Sin", MID: "Ahri", ADC: "Caitlyn", SUPPORT: "Lux" },
  enemies: { TOP: "Sett", JUNGLE: "Ivern", MID: "Orianna", ADC: "Kog'Maw", SUPPORT: "Lulu" },
  rank: "Émeraude",
  champions: {
    mine: {
      name: "Lee Sin",
      passive: { name: "Rafale", text: "Gagne de la vitesse d'attaque." },
      spells: [{ key: "Q", name: "Onde sonore", cooldown: "11/10/9/8/7", text: "Projectile." }],
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

describe("draftSheetMessage", () => {
  it("donne au modèle la fiche technique et les statistiques vérifiées", () => {
    const message = draftSheetMessage(base);
    expect(message).toContain("Données vérifiées (Data Dragon 16.20.1)");
    expect(message).toContain("- Q, Onde sonore (délai 11/10/9/8/7 s) : Projectile.");
    expect(message).toContain("Ivern : fiche technique indisponible.");
    expect(message).toContain(`${formatInteger(3141)} parties classées analysées`);
    expect(message).toContain(
      `${formatPercent(445 / 790)} de victoires pour Lee Sin sur 790 parties (fiable)`,
    );
  });

  it("dit clairement quand il n'y a pas de statistique", () => {
    expect(draftSheetMessage({ ...base, stats: null })).toContain(
      "Aucune statistique de parties classées disponible",
    );
    const thin = draftSheetMessage({
      ...base,
      stats: { ...base.stats!, duel: { games: 12, wins: 7 }, reliable: false },
    });
    expect(thin).toContain("peu fiable");
  });
});
