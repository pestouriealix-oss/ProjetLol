import { describe, expect, it } from "vitest";

import { matchFixture } from "@/lib/riot/fixtures";
import { matchSchema } from "@/lib/riot/schemas";

import { extractParticipation, kdaRatio, rankedQueue, summarizeMatch } from "./participation";

const parse = (options?: Parameters<typeof matchFixture>[0]) =>
  matchSchema.parse(matchFixture(options));

describe("summarizeMatch", () => {
  it("réduit la version du jeu au patch et lit la date et la durée", () => {
    expect(summarizeMatch(parse())).toEqual({
      id: "EUW1_7000000001",
      patch: "16.20",
      queueId: 420,
      startedAt: new Date(Date.UTC(2026, 9, 10, 18, 0, 0)),
      durationSeconds: 1754,
    });
  });
});

describe("extractParticipation", () => {
  it("retient la performance du joueur suivi", () => {
    const data = extractParticipation(parse(), "puuid-joueur");
    expect(data).toMatchObject({
      championName: "LeeSin",
      role: "JUNGLE",
      side: "BLUE",
      win: true,
      kills: 7,
      deaths: 2,
      assists: 9,
      cs: 180,
      gold: 11200,
      visionScore: 24,
    });
    // 7 + 9 sur les 7 + 4 × 3 éliminations de l'équipe
    expect(data?.killParticipation).toBeCloseTo(16 / 19);
    expect(data?.stats).toEqual({
      level: 15,
      teamKills: 19,
      items: [6692, 3111, 3071, 3364],
      opponentChampion: "Ivern",
    });
  });

  it("traduit les postes de Riot en rôles", () => {
    const roles = [0, 1, 2, 3, 4].map(
      (position) => extractParticipation(parse({ position }), "puuid-joueur")?.role,
    );
    expect(roles).toEqual(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]);
  });

  it("renvoie null si le joueur n'était pas dans la partie", () => {
    expect(extractParticipation(parse(), "quelqu'un-d'autre")).toBeNull();
  });

  it("ne divise pas par zéro quand l'équipe n'a fait aucune élimination", () => {
    const match = parse({ kills: 0, assists: 0 });
    for (const participant of match.info.participants) participant.kills = 0;
    expect(extractParticipation(match, "puuid-joueur")?.killParticipation).toBe(0);
  });
});

describe("kdaRatio et rankedQueue", () => {
  it("compte une mort au minimum", () => {
    expect(kdaRatio(7, 2, 9)).toBe(8);
    expect(kdaRatio(5, 0, 5)).toBe(10);
  });
  it("ne reconnaît que les files classées", () => {
    expect([420, 440, 450].map(rankedQueue)).toEqual(["SOLO", "FLEX", null]);
  });
});
