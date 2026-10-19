import { describe, expect, it } from "vitest";

import { RiotApiError } from "@/lib/riot/errors";
import type { MatchDto } from "@/lib/riot/schemas";

import { collectMatchups, ladders, type CollectDeps } from "./collect";

const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

function soloMatch(id: string, queueId = 420): MatchDto {
  return {
    metadata: { matchId: id },
    info: {
      gameCreation: 0,
      gameDuration: 1700,
      gameVersion: "16.20.1.1",
      queueId,
      participants: [100, 200].flatMap((teamId) =>
        POSITIONS.map((teamPosition, index) => ({
          puuid: `${id}-${teamId}-${index}`,
          teamId,
          championId: teamId + index,
          championName: "X",
          teamPosition,
          win: teamId === 200,
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
      ),
    },
  };
}

function harness(overrides: Partial<CollectDeps["api"]> = {}, knownIds: string[] = []) {
  let clock = 0;
  const recorded: string[] = [];
  const fetched: string[] = [];
  const known = new Set(knownIds);
  const deps: CollectDeps = {
    api: {
      getApexLadder: async () => [{ puuid: "a" }, { puuid: "b" }],
      getLadderPage: async () => [],
      // Les deux joueurs ont une partie en commun : elle ne doit être lue qu'une fois.
      getSoloMatchIds: async (_platform, puuid) =>
        puuid === "a" ? ["M1", "M2", "SHARED"] : ["SHARED", "M3"],
      getMatch: async (_platform, id) => {
        fetched.push(id);
        return soloMatch(id, id === "M2" ? 440 : 420);
      },
      ...overrides,
    },
    store: {
      known: async (ids) => new Set(ids.filter((id) => known.has(id))),
      record: async (id) => {
        if (known.has(id)) return false;
        known.add(id);
        recorded.push(id);
        return true;
      },
    },
    sleep: async (ms) => {
      clock += ms;
    },
    now: () => clock,
    random: () => 0.5,
    log: () => {},
  };
  return { deps, recorded, fetched, advance: (ms: number) => (clock += ms) };
}

describe("collectMatchups", () => {
  it("compte chaque partie une seule fois et ignore les autres files", async () => {
    const { deps, recorded, fetched } = harness({}, ["M3"]);
    const report = await collectMatchups(deps, { platform: "EUW1", budgetMs: 10 * 60_000 });
    expect(new Set(fetched)).toEqual(new Set(["M1", "M2", "SHARED"]));
    expect(fetched.filter((id) => id === "SHARED")).toHaveLength(1);
    expect(new Set(recorded)).toEqual(new Set(["M1", "SHARED"]));
    expect(report).toMatchObject({ counted: 2, ignored: 1 });
  });

  it("espace les appels pour rester sous la limite de Riot", async () => {
    const { deps } = harness();
    const times: number[] = [];
    const getMatch = deps.api.getMatch;
    deps.api.getMatch = async (platform, id) => {
      times.push(deps.now());
      return getMatch(platform, id);
    };
    await collectMatchups(deps, { platform: "EUW1", budgetMs: 10 * 60_000, minIntervalMs: 1000 });
    for (let index = 1; index < times.length; index += 1) {
      expect(times[index]! - times[index - 1]!).toBeGreaterThanOrEqual(1000);
    }
  });

  it("patiente quand Riot limite les appels, puis continue", async () => {
    let limited = false;
    const { deps, recorded } = harness({
      getMatch: async (_platform, id) => {
        if (id === "M1" && !limited) {
          limited = true;
          throw new RiotApiError("rate_limited", "trop", 30);
        }
        return soloMatch(id);
      },
    });
    const before = deps.now();
    await collectMatchups(deps, { platform: "EUW1", budgetMs: 60 * 60_000 });
    expect(deps.now() - before).toBeGreaterThanOrEqual(30_000);
    expect(recorded.length).toBeGreaterThan(0);
  });

  it("s'arrête net sur une clé refusée", async () => {
    const { deps } = harness({
      getApexLadder: async () => {
        throw new RiotApiError("invalid_key", "clé");
      },
    });
    await expect(collectMatchups(deps, { platform: "EUW1", budgetMs: 60_000 })).rejects.toThrow(
      "clé",
    );
  });

  it("respecte la durée prévue et le nombre maximal de parties", async () => {
    const { deps } = harness();
    const report = await collectMatchups(deps, {
      platform: "EUW1",
      budgetMs: 10 * 60_000,
      maxMatches: 1,
    });
    expect(report.counted).toBe(1);
  });

  it("part de Maître et plus, puis de Diamant et d'Émeraude", () => {
    const tiers = new Set(ladders().map((ladder) => ladder.tier));
    expect(tiers).toEqual(new Set(["challenger", "grandmaster", "master", "DIAMOND", "EMERALD"]));
  });
});
