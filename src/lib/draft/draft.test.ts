import { describe, expect, it } from "vitest";

import { createChampionMatcher, normalizeChampionName } from "./champion-match";
import {
  assignRoles,
  canAnalyse,
  draftSchema,
  duplicateChampions,
  emptyDraft,
  filledCount,
} from "./draft";

const CHAMPIONS = [
  { id: "LeeSin", name: "Lee Sin" },
  { id: "Kaisa", name: "Kai'Sa" },
  { id: "MonkeyKing", name: "Wukong" },
  { id: "Nunu", name: "Nunu et Willump" },
  { id: "KogMaw", name: "Kog'Maw" },
];

describe("createChampionMatcher", () => {
  const match = createChampionMatcher(CHAMPIONS);

  it("reconnaît l'identifiant, le nom affiché et les écritures approximatives", () => {
    expect(match("LeeSin")).toBe("LeeSin");
    expect(match("lee sin")).toBe("LeeSin");
    expect(match("Kai'Sa")).toBe("Kaisa");
    expect(match("KAISA")).toBe("Kaisa");
    expect(match("Nunu et Willump")).toBe("Nunu");
    expect(match("Nunu & Willump")).toBe("Nunu");
    expect(match("Wukong")).toBe("MonkeyKing");
  });

  it("ne devine pas un champion inconnu", () => {
    expect(match("Teemo")).toBeNull();
    expect(match("")).toBeNull();
    expect(match("???")).toBeNull();
  });

  it("ignore accents et ponctuation", () => {
    expect(normalizeChampionName("Kog'Maw")).toBe("kogmaw");
    expect(normalizeChampionName("Éclair")).toBe("eclair");
  });
});

describe("assignRoles", () => {
  it("place d'abord les rôles connus, puis complète dans l'ordre", () => {
    expect(
      assignRoles([
        { champion: "A", role: "MID" },
        { champion: "B", role: null },
        { champion: "C", role: "MID" },
        { champion: "D", role: "SUPPORT" },
        { champion: null, role: "TOP" },
      ]),
    ).toEqual({ TOP: "B", JUNGLE: "C", MID: "A", ADC: null, SUPPORT: "D" });
  });

  it("ignore ce qui dépasse cinq choix", () => {
    const picks = ["A", "B", "C", "D", "E", "F"].map((champion) => ({ champion, role: null }));
    expect(Object.values(assignRoles(picks))).toEqual(["A", "B", "C", "D", "E"]);
  });
});

describe("draft", () => {
  it("demande son champion et son vis-à-vis pour analyser", () => {
    const draft = emptyDraft("JUNGLE");
    expect(canAnalyse(draft)).toBe(false);
    draft.allies.JUNGLE = "LeeSin";
    expect(canAnalyse(draft)).toBe(false);
    draft.enemies.JUNGLE = "MonkeyKing";
    expect(canAnalyse(draft)).toBe(true);
    expect(filledCount(draft)).toBe(2);
  });

  it("repère un champion présent deux fois", () => {
    const draft = emptyDraft("MID");
    draft.allies.MID = "Kaisa";
    draft.enemies.ADC = "Kaisa";
    expect(duplicateChampions(draft)).toEqual(["Kaisa"]);
  });

  it("refuse un identifiant de champion mal formé", () => {
    const draft = emptyDraft("MID");
    expect(
      draftSchema.safeParse({ ...draft, allies: { ...draft.allies, MID: "<script>" } }).success,
    ).toBe(false);
  });
});

describe("readSheetView", async () => {
  const { readSheetView } = await import("./sheet-view");

  it("lit une fiche partielle sans erreur", () => {
    expect(
      readSheetView({
        winConditions: { ours: "Prendre l'av" },
        matchup: { options: [{ title: "Env" }] },
      }),
    ).toEqual({
      winConditions: { ours: "Prendre l'av" },
      matchup: { options: [{ title: "Env" }] },
    });
  });

  it("ignore ce qui est illisible", () => {
    expect(readSheetView({ matchup: { verdict: "peut-être", summary: 3 } })).toEqual({
      matchup: { verdict: undefined, summary: undefined },
    });
    expect(readSheetView("n'importe quoi")).toEqual({});
  });
});
