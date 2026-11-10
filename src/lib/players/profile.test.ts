import { describe, expect, it, vi } from "vitest";

import { RiotApiError } from "@/lib/riot/errors";
import { leagueEntriesFixture, matchFixture } from "@/lib/riot/fixtures";
import { matchSchema } from "@/lib/riot/schemas";

import { createProfileLoader, type ProfileLoaderOptions } from "./profile";

const PUUID = "puuid-joueur";
const RIOT_ID = { gameName: "joueur", tagLine: "euw" };
const match = (options: Parameters<typeof matchFixture>[0]) =>
  matchSchema.parse(matchFixture({ puuid: PUUID, ...options }));

const GAMES = {
  EUW1_1: match({ matchId: "EUW1_1", champion: "Ahri", position: 2, win: true, startedAt: 3000 }),
  EUW1_2: match({ matchId: "EUW1_2", champion: "Ahri", position: 2, win: false, startedAt: 2000 }),
  // ARAM : hors de la Faille, ignorée.
  EUW1_3: match({ matchId: "EUW1_3", queueId: 450, startedAt: 1500 }),
  EUW1_4: match({
    matchId: "EUW1_4",
    champion: "LeeSin",
    position: 1,
    queueId: 400,
    startedAt: 1000,
  }),
} as const;

function fakeApi(overrides: Partial<ProfileLoaderOptions["api"]> = {}) {
  const api: ProfileLoaderOptions["api"] = {
    getAccountByRiotId: vi.fn(async () => ({ puuid: PUUID, gameName: "Joueur", tagLine: "EUW" })),
    getSummoner: vi.fn(async () => ({ puuid: PUUID, profileIconId: 29, summonerLevel: 212 })),
    getLeagueEntries: vi.fn(async () => leagueEntriesFixture),
    getRecentMatchIds: vi.fn(async () => Object.keys(GAMES)),
    getMatch: vi.fn(async (_platform, id: string) => GAMES[id as keyof typeof GAMES]),
    ...overrides,
  };
  return api;
}

describe("profil public d'un joueur", () => {
  it("assemble classement, parties de la Faille, champions et postes", async () => {
    const loader = createProfileLoader({ api: fakeApi(), now: () => 10_000 });
    const result = await loader.load("EUW1", RIOT_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { profile } = result;

    // L'écriture exacte de Riot, pas celle tapée.
    expect(profile.riotId).toEqual({ gameName: "Joueur", tagLine: "EUW" });
    expect(profile.level).toBe(212);
    expect(profile.ranks.map((rank) => [rank.queue, rank.tier, rank.division, rank.lp])).toEqual([
      ["RANKED_SOLO_5x5", "EMERALD", "III", 42],
      ["RANKED_FLEX_SR", "PLATINUM", "I", 75],
    ]);
    expect(profile.matches.map((played) => played.matchId)).toEqual(["EUW1_1", "EUW1_2", "EUW1_4"]);
    expect(profile.matches[0]).toMatchObject({ championName: "Ahri", role: "MID", win: true });
    expect(profile.champions[0]).toMatchObject({ championName: "Ahri", games: 2, wins: 1 });
    expect(profile.roles).toEqual([
      { role: "MID", games: 2 },
      { role: "JUNGLE", games: 1 },
    ]);
    expect(profile.partial).toBe(false);
  });

  it("garde le profil en mémoire, sans tenir compte des majuscules", async () => {
    let clock = 0;
    const api = fakeApi();
    const loader = createProfileLoader({ api, now: () => clock, ttlMs: 5 * 60_000 });

    await loader.load("EUW1", RIOT_ID);
    expect(loader.peek("EUW1", { gameName: "JOUEUR", tagLine: "Euw" })?.ok).toBe(true);
    await loader.load("EUW1", { gameName: "JOUEUR", tagLine: "Euw" });
    expect(api.getAccountByRiotId).toHaveBeenCalledTimes(1);

    // Un autre serveur, c'est un autre joueur.
    expect(loader.peek("KR", RIOT_ID)).toBeNull();

    // Passé le délai, Riot est rappelé ; les parties, elles, restent connues.
    clock = 6 * 60_000;
    expect(loader.peek("EUW1", RIOT_ID)).toBeNull();
    await loader.load("EUW1", RIOT_ID);
    expect(api.getAccountByRiotId).toHaveBeenCalledTimes(2);
    expect(api.getMatch).toHaveBeenCalledTimes(Object.keys(GAMES).length);
  });

  it("ne fait qu'une lecture pour deux demandes simultanées", async () => {
    const api = fakeApi();
    const loader = createProfileLoader({ api });
    await Promise.all([loader.load("EUW1", RIOT_ID), loader.load("EUW1", RIOT_ID)]);
    expect(api.getAccountByRiotId).toHaveBeenCalledTimes(1);
  });

  it("dit pourquoi Riot n'a rien rendu", async () => {
    const missing = createProfileLoader({
      api: fakeApi({
        getAccountByRiotId: vi.fn(async () => {
          throw new RiotApiError("not_found", "Introuvable.");
        }),
      }),
    });
    expect(await missing.load("EUW1", RIOT_ID)).toEqual({ ok: false, reason: "not_found" });
    // Un Riot ID introuvable n'est pas redemandé tout de suite.
    expect(missing.peek("EUW1", RIOT_ID)).toEqual({ ok: false, reason: "not_found" });

    const busy = createProfileLoader({
      api: fakeApi({
        getLeagueEntries: vi.fn(async () => {
          throw new RiotApiError("rate_limited", "Trop d'appels.", 30);
        }),
      }),
    });
    expect(await busy.load("EUW1", RIOT_ID)).toEqual({ ok: false, reason: "rate_limited" });
    // Une limite d'appels n'est pas mise en mémoire : on peut réessayer.
    expect(busy.peek("EUW1", RIOT_ID)).toBeNull();
  });

  it("montre les parties déjà lues si Riot limite les appels en route", async () => {
    const api = fakeApi({
      getMatch: vi.fn(async (_platform, id: string) => {
        if (id === "EUW1_4") throw new RiotApiError("rate_limited", "Trop d'appels.", 30);
        return GAMES[id as keyof typeof GAMES];
      }),
    });
    const result = await createProfileLoader({ api }).load("EUW1", RIOT_ID);
    expect(result.ok && result.profile.partial).toBe(true);
    expect(result.ok && result.profile.matches.map((played) => played.matchId)).toEqual([
      "EUW1_1",
      "EUW1_2",
    ]);
  });
});
