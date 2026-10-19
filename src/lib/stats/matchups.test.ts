import { describe, expect, it } from "vitest";

import type { Role } from "@/lib/config";
import type { MatchDto } from "@/lib/riot/schemas";

import {
  assignTeamRoles,
  patchOfVersion,
  roleShares,
  sampleMatch,
  statsVerdict,
  winRate,
  MIN_RELIABLE_GAMES,
} from "./matchups";

const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

function match(overrides: Partial<MatchDto["info"]> = {}, positions = POSITIONS): MatchDto {
  const participants = [100, 200].flatMap((teamId) =>
    positions.map((teamPosition, index) => ({
      puuid: `${teamId}-${index}`,
      teamId,
      championId: teamId + index,
      championName: `C${teamId + index}`,
      teamPosition,
      win: teamId === 100,
      kills: 0,
      deaths: 0,
      assists: 0,
      champLevel: 0,
      totalMinionsKilled: 0,
      neutralMinionsKilled: 0,
      goldEarned: 0,
      totalDamageDealtToChampions: 0,
      visionScore: 0,
    })),
  );
  return {
    metadata: { matchId: "EUW1_1" },
    info: {
      gameCreation: 0,
      gameDuration: 1800,
      gameVersion: "16.20.712.3",
      queueId: 420,
      participants,
      ...overrides,
    },
  };
}

describe("sampleMatch", () => {
  it("retient chaque duel des deux côtés, et chaque champion à son poste", () => {
    const sample = sampleMatch(match());
    expect(sample?.patch).toBe("16.20");
    expect(sample?.roles).toHaveLength(10);
    expect(sample?.matchups).toHaveLength(10);
    expect(sample?.matchups).toContainEqual({
      role: "JUNGLE",
      champion: 101,
      opponent: 201,
      win: true,
    });
    expect(sample?.matchups).toContainEqual({
      role: "JUNGLE",
      champion: 201,
      opponent: 101,
      win: false,
    });
  });

  it("écarte les autres files, les parties écourtées et les postes incomplets", () => {
    expect(sampleMatch(match({ queueId: 440 }))).toBeNull();
    expect(sampleMatch(match({ gameDuration: 300 }))).toBeNull();
    expect(sampleMatch(match({}, ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", ""]))).toBeNull();
    expect(sampleMatch(match({}, ["TOP", "TOP", "MIDDLE", "BOTTOM", "UTILITY"]))).toBeNull();
  });
});

describe("lecture des chiffres", () => {
  it("réduit la version au patch", () => {
    expect(patchOfVersion("16.20.1")).toBe("16.20");
  });

  it("signale un échantillon trop petit", () => {
    expect(winRate(10, 6)).toEqual({ games: 10, wins: 6, rate: 0.6, reliable: false });
    expect(winRate(MIN_RELIABLE_GAMES, 20).reliable).toBe(true);
    expect(winRate(0, 0).rate).toBe(0);
  });

  it("tire un verdict des statistiques seulement quand elles sont fiables", () => {
    expect(statsVerdict({ games: 790, wins: 445 })).toBe("favorable");
    expect(statsVerdict({ games: 100, wins: 50 })).toBe("even");
    expect(statsVerdict({ games: 100, wins: 48 })).toBe("unfavorable");
    expect(statsVerdict({ games: 12, wins: 10 })).toBeNull();
    expect(statsVerdict(null)).toBeNull();
  });
});

describe("assignTeamRoles", () => {
  const shares = roleShares([
    { role: "TOP", champion: 1, games: 90 },
    { role: "MID", champion: 1, games: 10 },
    { role: "JUNGLE", champion: 2, games: 100 },
    { role: "MID", champion: 3, games: 80 },
    { role: "TOP", champion: 3, games: 20 },
    { role: "ADC", champion: 4, games: 100 },
    { role: "SUPPORT", champion: 5, games: 100 },
  ] satisfies { role: Role; champion: number; games: number }[]);

  it("trouve la répartition la plus probable", () => {
    const roles = assignTeamRoles(
      [5, 4, 3, 2, 1].map((champion) => ({ champion, smite: false })),
      shares,
    );
    expect(Object.fromEntries(roles)).toEqual({
      1: "TOP",
      2: "JUNGLE",
      3: "MID",
      4: "ADC",
      5: "SUPPORT",
    });
  });

  it("met en jungle celui qui a le Châtiment, même hors de ses habitudes", () => {
    const roles = assignTeamRoles(
      [
        { champion: 1, smite: false },
        { champion: 2, smite: false },
        { champion: 3, smite: true },
        { champion: 4, smite: false },
        { champion: 5, smite: false },
      ],
      shares,
    );
    expect(roles.get(3)).toBe("JUNGLE");
    expect(roles.get(2)).not.toBe("JUNGLE");
  });

  it("répartit quand même sans aucune statistique", () => {
    const roles = assignTeamRoles(
      [10, 11, 12, 13, 14].map((champion, index) => ({ champion, smite: index === 2 })),
      () => undefined,
    );
    expect(new Set(roles.values()).size).toBe(5);
    expect(roles.get(12)).toBe("JUNGLE");
  });
});
