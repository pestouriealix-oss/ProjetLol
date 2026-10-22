import { describe, expect, it } from "vitest";

import { timelineSchema } from "@/lib/riot/schemas";

import { reduceTimeline, reducedTimelineSchema } from "./timeline";

const frame = (minute: number, gold: [number, number], events: object[] = []) => ({
  timestamp: minute * 60_000 + (minute > 0 ? 120 : 0),
  participantFrames: {
    "1": { totalGold: gold[0], minionsKilled: minute * 7, jungleMinionsKilled: minute, xp: minute * 280 },
    "2": { totalGold: gold[1] },
  },
  events,
});

const timeline = timelineSchema.parse({
  info: {
    participants: [
      { participantId: 1, puuid: "bleu" },
      { participantId: 2, puuid: "rouge" },
    ],
    frames: [
      frame(
        0,
        [500, 500],
        [
          { type: "ITEM_PURCHASED", timestamp: 2_000, participantId: 1, itemId: 1055 },
          { type: "ITEM_PURCHASED", timestamp: 3_000, participantId: 1, itemId: 2003 },
          { type: "ITEM_UNDO", timestamp: 4_000, participantId: 1, beforeId: 2003, afterId: 0 },
          {
            type: "SKILL_LEVEL_UP",
            timestamp: 5_000,
            participantId: 1,
            skillSlot: 1,
            levelUpType: "NORMAL",
          },
        ],
      ),
      frame(
        1,
        [900, 800],
        [
          {
            type: "SKILL_LEVEL_UP",
            timestamp: 61_000,
            participantId: 1,
            skillSlot: 3,
            levelUpType: "NORMAL",
          },
          {
            type: "ELITE_MONSTER_KILL",
            timestamp: 65_000,
            killerTeamId: 200,
            monsterType: "DRAGON",
            monsterSubType: "FIRE_DRAGON",
          },
          {
            type: "ELITE_MONSTER_KILL",
            timestamp: 66_000,
            killerTeamId: 100,
            monsterType: "HORDE",
          },
          { type: "BUILDING_KILL", timestamp: 70_000, teamId: 200, buildingType: "TOWER_BUILDING" },
          { type: "CHAMPION_KILL", timestamp: 71_000, killerId: 1, victimId: 2 },
        ],
      ),
    ],
  },
});

describe("reduceTimeline", () => {
  const reduced = reduceTimeline(timeline, (puuid) => (puuid === "bleu" ? 100 : 200));

  it("additionne l'or de chaque équipe minute par minute", () => {
    expect(reduced.gold).toEqual([
      { minute: 0, blue: 500, red: 500 },
      { minute: 1, blue: 900, red: 800 },
    ]);
  });

  it("garde les achats sans ceux annulés, et l'ordre des compétences", () => {
    expect(reduced.players.bleu).toMatchObject({
      items: [{ seconds: 2, itemId: 1055 }],
      skills: [1, 3],
    });
  });

  it("suit l'or, les CS et l'expérience de chaque joueur, ses morts et ses éliminations", () => {
    expect(reduced.players.bleu?.frames).toEqual({ gold: [500, 900], cs: [0, 8], xp: [0, 280] });
    expect(reduced.players.bleu?.takedowns).toEqual([71]);
    expect(reduced.players.rouge?.deaths).toEqual([71]);
    expect(reduced.players.rouge?.frames.cs).toEqual([0, 0]);
  });

  it("attribue chaque objectif à l'équipe qui l'a pris", () => {
    expect(reduced.objectives).toEqual([
      { seconds: 65, teamId: 200, type: "dragon", subType: "FIRE_DRAGON" },
      { seconds: 66, teamId: 100, type: "grubs", subType: null },
      // Tour perdue par les rouges : prise par les bleus.
      { seconds: 70, teamId: 100, type: "tower", subType: null },
    ]);
  });

  it("produit une forme que son schéma relit", () => {
    expect(reducedTimelineSchema.parse(reduced)).toEqual(reduced);
  });
});
