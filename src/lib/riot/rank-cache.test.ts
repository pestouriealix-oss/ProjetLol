import { describe, expect, it } from "vitest";

import { RiotApiError } from "./errors";
import { createRankCache } from "./rank-cache";
import type { LeagueEntryDto } from "./schemas";

const entry = (tier: string): LeagueEntryDto[] =>
  [
    { queueType: "RANKED_SOLO_5x5", tier, rank: "II", leaguePoints: 40, wins: 10, losses: 8 },
  ] as LeagueEntryDto[];

describe("createRankCache", () => {
  it("garde un classement en mémoire pendant sa durée de vie", async () => {
    let clock = 0;
    const calls: string[] = [];
    const cache = createRankCache({
      load: async (puuid) => {
        calls.push(puuid);
        return entry("GOLD");
      },
      ttlMs: 1000,
      now: () => clock,
    });
    await cache.get("a");
    clock = 999;
    await cache.get("a");
    expect(calls).toEqual(["a"]);
    clock = 1000;
    await cache.get("a");
    expect(calls).toEqual(["a", "a"]);
  });

  it("oublie les plus anciens au-delà de la limite", async () => {
    const calls: string[] = [];
    const cache = createRankCache({
      load: async (puuid) => {
        calls.push(puuid);
        return [];
      },
      maxEntries: 2,
    });
    await cache.many(["a", "b"]);
    await cache.get("c");
    await cache.get("b");
    await cache.get("a");
    expect(calls).toEqual(["a", "b", "c", "a"]);
  });

  it("laisse de côté les joueurs que Riot ne renvoie pas", async () => {
    const cache = createRankCache({
      load: async (puuid) => {
        if (puuid === "b") throw new RiotApiError("rate_limited", "trop d'appels");
        return entry("SILVER");
      },
    });
    const found = await cache.many(["a", "b"]);
    expect([...found.keys()]).toEqual(["a"]);
  });

  it("ne masque pas une erreur de programmation", async () => {
    const cache = createRankCache({
      load: async () => {
        throw new TypeError("bug");
      },
    });
    await expect(cache.many(["a"])).rejects.toThrow("bug");
  });
});
