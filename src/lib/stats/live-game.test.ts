import { describe, expect, it } from "vitest";

import { activeGameSchema, leagueEntriesSchema } from "@/lib/riot/schemas";

import { buildLiveGame, rankQueueFor } from "./live-game";

const game = activeGameSchema.parse({
  gameId: 1,
  gameQueueConfigId: 420,
  gameStartTime: Date.UTC(2026, 9, 15, 20, 0),
  participants: [
    ...[0, 1, 2, 3, 4].map((index) => ({
      puuid: `bleu-${index}`,
      teamId: 100,
      championId: 64 + index,
      spell1Id: 4,
      spell2Id: 11,
      riotId: `Bleu ${index}#EUW`,
      perks: { perkIds: [8112, 8139], perkStyle: 8100, perkSubStyle: 8300 },
    })),
    ...[0, 1, 2, 3, 4].map((index) => ({
      puuid: index === 2 ? "moi" : `rouge-${index}`,
      teamId: 200,
      championId: 100 + index,
      riotId: index === 2 ? "Akiixxx#EUWW" : `Rouge#${index}`,
    })),
  ],
  bannedChampions: [
    { championId: 157, teamId: 100 },
    { championId: -1, teamId: 200 },
  ],
});

describe("buildLiveGame", () => {
  it("met l'équipe du joueur en premier, avec ses bannissements", () => {
    const live = buildLiveGame(game, "moi", new Map());
    expect(live.teams.map((team) => [team.side, team.isMine])).toEqual([
      ["RED", true],
      ["BLUE", false],
    ]);
    // Un bannissement manqué (-1) n'est pas un champion.
    expect(live.teams[0].bans).toEqual([]);
    expect(live.teams[1].bans).toEqual([157]);
    expect(live.teams[0].players.filter((player) => player.isMe)).toHaveLength(1);
    expect(live.startedAt?.toISOString()).toBe("2026-10-15T20:00:00.000Z");
  });

  it("découpe le Riot ID et garde sorts et runes", () => {
    const [, blue] = buildLiveGame(game, "moi", new Map()).teams;
    expect(blue.players[0]).toMatchObject({
      riotId: { gameName: "Bleu 0", tagLine: "EUW" },
      spells: [4, 11],
      keystone: 8112,
      secondaryStyle: 8300,
    });
  });

  it("donne le classement de la file jouée", () => {
    const ranks = new Map([
      [
        "bleu-0",
        leagueEntriesSchema.parse([
          {
            queueType: "RANKED_FLEX_SR",
            tier: "GOLD",
            rank: "I",
            leaguePoints: 10,
            wins: 5,
            losses: 5,
          },
          {
            queueType: "RANKED_SOLO_5x5",
            tier: "DIAMOND",
            rank: "IV",
            leaguePoints: 33,
            wins: 80,
            losses: 70,
          },
        ]),
      ],
    ]);
    const blue = buildLiveGame(game, "moi", ranks).teams[1];
    expect(blue.players[0]?.rank).toMatchObject({ tier: "DIAMOND", division: "IV", lp: 33 });
    expect(blue.players[1]?.rank).toBeNull();
    expect(rankQueueFor(440)).toBe("RANKED_FLEX_SR");
    expect(rankQueueFor(400)).toBe("RANKED_SOLO_5x5");
  });
});
