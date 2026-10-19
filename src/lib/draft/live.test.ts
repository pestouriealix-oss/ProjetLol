import { describe, expect, it } from "vitest";

import type { Role } from "@/lib/config";
import type { ActiveGameDto } from "@/lib/riot/schemas";

import { draftFromActiveGame, SMITE_ID, tagLikelihood } from "./live";

// Clés Riot : Garen 86, Lee Sin 64, Ahri 103, Caitlyn 51, Lux 99 ;
// Sett 875, Ivern 427, Orianna 61, Kog'Maw 96, Lulu 117.
const IDS: Record<number, string> = {
  86: "Garen",
  64: "LeeSin",
  103: "Ahri",
  51: "Caitlyn",
  99: "Lux",
  875: "Sett",
  427: "Ivern",
  61: "Orianna",
  96: "KogMaw",
  117: "Lulu",
};
const HABITS: Record<number, Role> = {
  86: "TOP",
  64: "JUNGLE",
  103: "MID",
  51: "ADC",
  99: "SUPPORT",
  875: "TOP",
  427: "JUNGLE",
  61: "MID",
  96: "ADC",
  117: "SUPPORT",
};

function game(): ActiveGameDto {
  const player = (teamId: number, championId: number, puuid: string | null = null) => ({
    puuid,
    teamId,
    championId,
    spell1Id: 4,
    spell2Id: HABITS[championId] === "JUNGLE" ? SMITE_ID : 14,
    bot: false,
  });
  return {
    gameId: 1,
    gameQueueConfigId: 420,
    gameMode: "CLASSIC",
    gameStartTime: 0,
    gameLength: 0,
    // Dans le désordre, comme Riot peut les renvoyer.
    participants: [
      player(100, 99),
      player(100, 64, "moi"),
      player(100, 51),
      player(100, 86),
      player(100, 103),
      player(200, 117),
      player(200, 96),
      player(200, 875),
      player(200, 61),
      player(200, 427),
    ],
    bannedChampions: [],
  };
}

const idOf = (key: number) => IDS[key] ?? null;
const habits = (key: number, role: Role) => (HABITS[key] === role ? 0.9 : 0.025);

describe("draftFromActiveGame", () => {
  it("range les dix champions à leur poste et trouve celui du joueur", () => {
    expect(draftFromActiveGame(game(), "moi", idOf, habits)).toEqual({
      allies: { TOP: "Garen", JUNGLE: "LeeSin", MID: "Ahri", ADC: "Caitlyn", SUPPORT: "Lux" },
      enemies: { TOP: "Sett", JUNGLE: "Ivern", MID: "Orianna", ADC: "KogMaw", SUPPORT: "Lulu" },
      myRole: "JUNGLE",
    });
  });

  it("renvoie null si le joueur n'est pas dans la partie ou si un champion est inconnu", () => {
    expect(draftFromActiveGame(game(), "autre", idOf, habits)).toBeNull();
    expect(
      draftFromActiveGame(game(), "moi", (key) => (key === 96 ? null : idOf(key)), habits),
    ).toBeNull();
  });
});

describe("tagLikelihood", () => {
  it("place un tireur en bas et un support en soutien", () => {
    expect(tagLikelihood(["Marksman"], "ADC")).toBeGreaterThan(0.5);
    expect(tagLikelihood(["Support", "Mage"], "SUPPORT")).toBeGreaterThan(
      tagLikelihood(["Support", "Mage"], "MID")!,
    );
    expect(tagLikelihood([], "TOP")).toBeUndefined();
  });
});
