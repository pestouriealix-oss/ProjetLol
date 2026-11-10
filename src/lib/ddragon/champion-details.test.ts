import { describe, expect, it } from "vitest";

import { championFingerprint } from "./champion-details";

const spell = (cooldownBurn: string) => ({
  name: "Sort",
  description: "Inflige des dégâts.",
  cooldownBurn,
  effectBurn: [null, "40/60/80"],
  maxrank: 5,
});

const katarina = {
  id: "Katarina",
  name: "Katarina",
  version: "16.21.1",
  stats: { hp: 672, armor: 32 },
  passive: { name: "Voracité", description: "Un kill réduit ses délais." },
  spells: [spell("11/10/9/8/7"), spell("15"), spell("14/12.5/11/9.5/8"), spell("90/60/45")],
};

describe("championFingerprint", () => {
  it("ne change pas d'un patch à l'autre si rien n'a bougé", () => {
    expect(championFingerprint({ ...katarina, version: "16.22.1" })).toBe(
      championFingerprint(katarina),
    );
    // L'ordre des statistiques dans le fichier ne compte pas.
    expect(championFingerprint({ ...katarina, stats: { armor: 32, hp: 672 } })).toBe(
      championFingerprint(katarina),
    );
  });

  it("change au moindre équilibrage : délai, statistique ou description", () => {
    const base = championFingerprint(katarina);
    const changed = [
      { ...katarina, spells: [spell("10/9/8/7/6"), ...katarina.spells.slice(1)] },
      { ...katarina, stats: { hp: 650, armor: 32 } },
      { ...katarina, passive: { ...katarina.passive, description: "Autre effet." } },
    ];
    for (const champion of changed) expect(championFingerprint(champion)).not.toBe(base);
  });
});
