import { describe, expect, it } from "vitest";

import { winConditionsMessage } from "./win-conditions";

describe("winConditionsMessage", () => {
  it("donne les deux équipes, le poste et le classement du joueur", () => {
    const message = winConditionsMessage({
      patch: "16.20",
      myRole: "JUNGLE",
      allies: { TOP: "Garen", JUNGLE: "Lee Sin", MID: "Ahri", ADC: "Caitlyn", SUPPORT: "Lux" },
      enemies: { TOP: "Sett", JUNGLE: "Ivern", MID: null, ADC: "Kog'Maw", SUPPORT: "Lulu" },
      rank: "Émeraude",
    });
    expect(message).toContain("Le joueur joue Lee Sin au poste jungle.");
    expect(message).toContain("Son classement : Émeraude.");
    expect(message).toContain("- milieu : inconnu");
    expect(message).toContain("- support : Lulu");
  });
});
