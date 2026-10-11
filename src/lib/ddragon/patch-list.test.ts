import { describe, expect, it } from "vitest";

import { patchNotesUrl, toPatches } from "./patch-list";

describe("toPatches", () => {
  it("nomme les patchs comme les joueurs, à partir des versions de Riot", () => {
    expect(toPatches(["16.20.1", "16.19.1"])).toEqual([
      {
        id: "26.20",
        version: "16.20.1",
        notesUrl:
          "https://www.leagueoflegends.com/fr-fr/news/game-updates/league-of-legends-patch-26-20-notes/",
      },
      {
        id: "26.19",
        version: "16.19.1",
        notesUrl:
          "https://www.leagueoflegends.com/fr-fr/news/game-updates/league-of-legends-patch-26-19-notes/",
      },
    ]);
  });

  it("s'arrête à la saison en cours", () => {
    const ids = toPatches(["16.2.1", "16.1.1", "15.24.1", "15.23.1"]).map((patch) => patch.id);
    expect(ids).toEqual(["26.2", "26.1"]);
  });

  it("ne garde qu'une entrée par patch et ignore les formats inattendus", () => {
    const ids = toPatches(["16.3.2", "16.3.1", "lolpatch_16.2", "16.2.1"]).map((patch) => patch.id);
    expect(ids).toEqual(["26.3", "26.2"]);
  });

  it("renvoie une liste vide quand rien n'est exploitable", () => {
    expect(toPatches([])).toEqual([]);
    expect(toPatches(["lolpatch_7.20"])).toEqual([]);
  });
});

describe("patchNotesUrl", () => {
  it("remplace le point par un tiret dans l'adresse", () => {
    expect(patchNotesUrl("26.9")).toContain("patch-26-9-notes");
  });
});
