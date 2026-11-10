import { describe, expect, it } from "vitest";

import { readChampSelect } from "./champ-select";
import { matchHasStarted, readEventNames, readInfoEntries } from "./launcher";
import { stageFrom } from "./stage";

describe("mises à jour d'Overwolf", () => {
  it("lit les deux formes d'envoi", () => {
    expect(
      readInfoEntries({ info: { game_flow: { phase: "ChampSelect" } }, feature: "game_flow" }),
    ).toEqual([{ category: "game_flow", key: "phase", value: "ChampSelect" }]);
    expect(
      readInfoEntries({
        feature: "game_flow",
        category: "game_flow",
        key: "phase",
        value: "Lobby",
      }),
    ).toEqual([{ category: "game_flow", key: "phase", value: "Lobby" }]);
    expect(readInfoEntries("n'importe quoi")).toEqual([]);
  });

  it("voit que la partie a commencé à l'horloge, pas avant", () => {
    const loading = readInfoEntries({ info: { live_client_data: { game_data: "{}" } } });
    const started = readInfoEntries({
      info: { live_client_data: { game_data: JSON.stringify({ gameTime: 4.2 }) } },
    });
    expect(matchHasStarted(loading, [])).toBe(false);
    expect(matchHasStarted(started, [])).toBe(true);
    expect(
      matchHasStarted([], readEventNames({ events: [{ name: "match_clock", data: "3" }] })),
    ).toBe(true);
  });
});

describe("sélection des champions", () => {
  const raw = (me: Record<string, unknown>) =>
    JSON.stringify({
      localPlayerCellId: 2,
      myTeam: [
        { cellId: 1, championId: 64, championPickIntent: 0, assignedPosition: "jungle" },
        { cellId: 2, championPickIntent: 0, championId: 0, assignedPosition: "middle", ...me },
      ],
      theirTeam: [{ cellId: 6, championId: 0, puuid: "" }],
    });

  it("garde le champion et le poste du joueur, rien d'autre", () => {
    expect(readChampSelect(raw({ championId: 103 }))).toEqual({
      championKey: 103,
      intent: false,
      role: "MID",
    });
  });

  it("distingue l'intention du choix", () => {
    expect(readChampSelect(raw({ championPickIntent: 157 }))).toEqual({
      championKey: 157,
      intent: true,
      role: "MID",
    });
    expect(readChampSelect(raw({ assignedPosition: "" }))).toEqual({
      championKey: null,
      intent: false,
      role: null,
    });
  });

  it("ignore une sélection illisible", () => {
    expect(readChampSelect("{")).toBeNull();
    expect(readChampSelect({ myTeam: [] })).toBeNull();
  });
});

describe("étape du joueur", () => {
  const stage = (launcherPhase: string | null, gameRunning = false, matchStarted = false) =>
    stageFrom({ launcherPhase, gameRunning, matchStarted });

  it("suit le client puis la partie", () => {
    expect(stage(null)).toBe("offline");
    expect(stage("Lobby")).toBe("lobby");
    expect(stage("ChampSelect")).toBe("champ_select");
    expect(stage("InProgress")).toBe("loading");
    expect(stage("InProgress", true)).toBe("loading");
    expect(stage("InProgress", true, true)).toBe("in_game");
    expect(stage("EndOfGame")).toBe("after_game");
  });
});
