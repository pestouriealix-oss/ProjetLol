import { describe, expect, it } from "vitest";

import { lanePartnerRole, matchupNoteKey, type MatchupKeyParts } from "./matchup-key";

const base: MatchupKeyParts = {
  promptVersion: "draft-matchup@1",
  model: "claude-haiku-5-5",
  patch: "16.20",
  fingerprints: { mine: "aaaa", theirs: "bbbb" },
  role: "JUNGLE",
  mine: "LeeSin",
  theirs: "Ivern",
  partners: null,
  statsVerdict: "favorable",
};

describe("matchupNoteKey", () => {
  it("donne la même clé pour le même duel, quelle que soit la partie", () => {
    expect(matchupNoteKey({ ...base })).toBe(matchupNoteKey(base));
  });

  it("change dès que le texte doit changer", () => {
    const key = matchupNoteKey(base);
    for (const change of [
      { promptVersion: "draft-matchup@2" },
      { model: "claude-sonnet-5-5" },
      { fingerprints: { mine: "aaaa", theirs: "cccc" } },
      { patch: "17.1" },
      { theirs: "Graves" },
      { statsVerdict: null },
      { partners: { mine: "Lux", theirs: "Lulu" } },
    ] satisfies Partial<MatchupKeyParts>[]) {
      expect(matchupNoteKey({ ...base, ...change })).not.toBe(key);
    }
  });
});

describe("un duel d'un patch à l'autre", () => {
  it("reste le même si aucun des deux champions n'a changé", () => {
    expect(matchupNoteKey({ ...base, patch: "16.21" })).toBe(matchupNoteKey(base));
  });

  it("ne vaut que pour son patch quand la fiche d'un champion manque", () => {
    const blind = { ...base, fingerprints: null };
    expect(matchupNoteKey({ ...blind, patch: "16.21" })).not.toBe(matchupNoteKey(blind));
  });
});

describe("lanePartnerRole", () => {
  it("associe tireur et support, et personne d'autre", () => {
    expect(lanePartnerRole("ADC")).toBe("SUPPORT");
    expect(lanePartnerRole("SUPPORT")).toBe("ADC");
    expect(lanePartnerRole("MID")).toBeNull();
  });
});
