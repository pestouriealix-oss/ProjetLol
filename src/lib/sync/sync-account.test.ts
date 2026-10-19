/**
 * Tests d'intégration de la synchronisation, sur une vraie base PostgreSQL et
 * une fausse API Riot. Ignorés si DATABASE_URL n'est pas définie.
 */
import { randomUUID } from "node:crypto";

import { like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type * as MatchesApi from "@/lib/db/matches";
import type * as RanksApi from "@/lib/db/ranks";
import type * as RiotAccountsApi from "@/lib/db/riot-accounts";
import type * as UsersApi from "@/lib/db/users";
import type { RiotApi } from "@/lib/riot/api";
import { RiotApiError } from "@/lib/riot/errors";
import { leagueEntriesFixture, matchFixture } from "@/lib/riot/fixtures";
import { leagueEntriesSchema, matchSchema } from "@/lib/riot/schemas";

import type * as SyncApi from "./sync-account";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("synchronisation d'un compte Riot", () => {
  let sync: typeof SyncApi;
  let accountsApi: typeof RiotAccountsApi;
  let matchesApi: typeof MatchesApi;
  let ranksApi: typeof RanksApi;
  let usersApi: typeof UsersApi;
  const users: string[] = [];
  /** Préfixe propre à cette exécution : les parties de test se retrouvent pour le ménage. */
  const run = `TEST${randomUUID().slice(0, 8)}`;

  const newUser = async () => {
    const user = await usersApi.createUserWithPassword({
      email: `test-sync-${randomUUID()}@example.test`,
      name: null,
      passwordHash: "non-utilisé",
    });
    users.push(user.id);
    return user.id;
  };

  const link = (userId: string, gameName = "Joueur") =>
    accountsApi.addRiotAccount(
      userId,
      { gameName, tagLine: "TEST", platform: "EUW1", roles: [] },
      { maxAccounts: 5 },
    );

  /** Fausse API : un joueur, une liste de parties, et des pannes à la demande. */
  function fakeApi({
    puuid = `puuid-${randomUUID()}`,
    matchIds,
    failOn,
  }: {
    puuid?: string;
    matchIds: string[];
    failOn?: Record<string, RiotApiError>;
  }) {
    const calls = { account: 0, matches: [] as string[] };
    const api: RiotApi = {
      async getAccountByRiotId(_platform, gameName) {
        calls.account += 1;
        if (failOn?.account) throw failOn.account;
        return { puuid, gameName: gameName.toUpperCase(), tagLine: "TEST" };
      },
      async getMatchTimeline() {
        throw new Error("pas de chronologie dans ces tests");
      },
      async getActiveGame() {
        return null;
      },
      async getLadderPage() {
        return [];
      },
      async getApexLadder() {
        return [];
      },
      async getSoloMatchIds() {
        return [];
      },
      async getSummoner(_platform, summonerPuuid) {
        return { puuid: summonerPuuid, profileIconId: 4568, summonerLevel: 312 };
      },
      async getLeagueEntries() {
        return leagueEntriesSchema.parse(leagueEntriesFixture);
      },
      async getRankedMatchIds() {
        return [...matchIds];
      },
      async getMatch(_platform, matchId) {
        calls.matches.push(matchId);
        const failure = failOn?.[matchId];
        if (failure) throw failure;
        const index = matchIds.indexOf(matchId);
        return matchSchema.parse(
          matchFixture({
            matchId,
            puuid,
            win: index % 2 === 0,
            startedAt: Date.UTC(2026, 9, 10) - index * 3_600_000,
          }),
        );
      },
    };
    return { api, calls, puuid };
  }

  const ids = (...numbers: number[]) => numbers.map((number) => `${run}_${number}`);
  const at = (minutes: number) => () => new Date(Date.UTC(2026, 9, 11, 12) + minutes * 60_000);

  beforeAll(async () => {
    sync = await import("./sync-account");
    accountsApi = await import("@/lib/db/riot-accounts");
    matchesApi = await import("@/lib/db/matches");
    ranksApi = await import("@/lib/db/ranks");
    usersApi = await import("@/lib/db/users");
  });

  afterAll(async () => {
    for (const userId of users) await usersApi.deleteUser(userId);
    const { db } = await import("@/lib/db/client");
    const { matches } = await import("@/lib/db/schema");
    await db.delete(matches).where(like(matches.id, `${run}_%`));
  });

  it("vérifie le compte, relève le classement et enregistre les parties", async () => {
    const alice = await newUser();
    const account = await link(alice, "alice");
    const { api, puuid } = fakeApi({ matchIds: ids(1, 2, 3) });

    const result = await sync.syncRiotAccount(alice, account.id, { api, now: at(0) });
    expect(result).toEqual({ ok: true, newMatches: 3, partial: false });

    const saved = await accountsApi.findRiotAccount(alice, account.id);
    // L'écriture exacte du Riot ID vient de Riot.
    expect(saved).toMatchObject({
      puuid,
      gameName: "ALICE",
      profileIconId: 4568,
      summonerLevel: 312,
    });
    expect(saved?.verifiedAt).toBeInstanceOf(Date);
    expect(saved?.lastSyncedAt).toEqual(at(0)());

    const played = await matchesApi.listPlayedMatches(alice, account.id, { limit: 10 });
    expect(played.map((match) => match.matchId)).toEqual(ids(1, 2, 3));
    expect(played[0]).toMatchObject({ championName: "LeeSin", role: "JUNGLE", win: true, cs: 180 });

    const ranks = await ranksApi.listLatestRanks(alice, account.id);
    expect(ranks.map((rank) => `${rank.queue} ${rank.tier} ${rank.division} ${rank.lp}`)).toEqual([
      "RANKED_FLEX_SR PLATINUM I 75",
      "RANKED_SOLO_5x5 EMERALD III 42",
    ]);

    const [leeSin] = await matchesApi.listChampionStats(alice, account.id, "ALL");
    expect(leeSin).toMatchObject({ championName: "LeeSin", games: 3, wins: 2, cs: 540 });
    expect(await matchesApi.listChampionStats(alice, account.id, "FLEX")).toEqual([]);
    expect(await matchesApi.listRoleStats(alice, account.id, "SOLO")).toMatchObject([
      { role: "JUNGLE", games: 3 },
    ]);
    expect(await matchesApi.listMatchups(alice, account.id, "ALL")).toEqual([
      { opponent: "Ivern", games: 3, wins: 2 },
    ]);
    const history = await ranksApi.listRankHistory(alice, account.id, "RANKED_SOLO_5x5", {
      limit: 10,
    });
    expect(history.map((rank) => `${rank.tier} ${rank.division} ${rank.lp}`)).toEqual([
      "EMERALD III 42",
    ]);

    const champions = await matchesApi.listChampionRecords(alice, account.id, { limit: 5 });
    expect(champions).toEqual([
      { championName: "LeeSin", games: 3, wins: 2, kills: 21, deaths: 6, assists: 27 },
    ]);
  });

  it("attend entre deux synchronisations, puis ne télécharge que les nouvelles parties", async () => {
    const user = await newUser();
    const account = await link(user);
    const first = fakeApi({ matchIds: ids(11, 12) });
    await sync.syncRiotAccount(user, account.id, { api: first.api, now: at(0) });

    const tooSoon = await sync.syncRiotAccount(user, account.id, { api: first.api, now: at(0.5) });
    expect(tooSoon).toEqual({ ok: false, reason: "cooldown", retryAfterSeconds: 30 });

    const later = fakeApi({ puuid: first.puuid, matchIds: ids(10, 11, 12) });
    const result = await sync.syncRiotAccount(user, account.id, { api: later.api, now: at(5) });
    expect(result).toEqual({ ok: true, newMatches: 1, partial: false });
    expect(later.calls.matches).toEqual(ids(10));
    // Compte déjà vérifié : Riot n'est pas réinterrogé sur son identité.
    expect(later.calls.account).toBe(0);
  });

  it("garde ce qui est fait quand Riot demande d'attendre, et permet de reprendre", async () => {
    const user = await newUser();
    const account = await link(user);
    const matchIds = ids(21, 22, 23);
    const limited = fakeApi({
      matchIds,
      failOn: { [matchIds[1]!]: new RiotApiError("rate_limited", "trop d'appels", 120) },
    });

    const interrupted = await sync.syncRiotAccount(user, account.id, {
      api: limited.api,
      now: at(0),
    });
    expect(interrupted).toEqual({ ok: true, newMatches: 1, partial: true });

    const resumed = fakeApi({ puuid: limited.puuid, matchIds });
    const result = await sync.syncRiotAccount(user, account.id, { api: resumed.api, now: at(0.1) });
    expect(result).toEqual({ ok: true, newMatches: 2, partial: false });
  });

  it("explique les échecs : joueur inconnu, clé refusée, partie disparue", async () => {
    const user = await newUser();
    const account = await link(user);

    const unknown = fakeApi({
      matchIds: [],
      failOn: { account: new RiotApiError("not_found", "inconnu") },
    });
    expect(await sync.syncRiotAccount(user, account.id, { api: unknown.api })).toEqual({
      ok: false,
      reason: "player_unknown",
    });

    const badKey = fakeApi({
      matchIds: [],
      failOn: { account: new RiotApiError("invalid_key", "clé") },
    });
    expect(await sync.syncRiotAccount(user, account.id, { api: badKey.api })).toMatchObject({
      ok: false,
      reason: "invalid_key",
    });

    const matchIds = ids(31, 32);
    const purged = fakeApi({
      matchIds,
      failOn: { [matchIds[0]!]: new RiotApiError("not_found", "purgée") },
    });
    expect(await sync.syncRiotAccount(user, account.id, { api: purged.api })).toEqual({
      ok: true,
      newMatches: 1,
      partial: false,
    });
  });

  it("un utilisateur ne peut ni synchroniser ni lire le compte d'un autre", async () => {
    const alice = await newUser();
    const bob = await newUser();
    const account = await link(alice);
    const { api } = fakeApi({ matchIds: ids(41) });
    await sync.syncRiotAccount(alice, account.id, { api, now: at(0) });

    expect(await sync.syncRiotAccount(bob, account.id, { api, now: at(10) })).toEqual({
      ok: false,
      reason: "account_missing",
    });
    expect(await matchesApi.listPlayedMatches(bob, account.id, { limit: 10 })).toEqual([]);
    expect(await matchesApi.listChampionRecords(bob, account.id, { limit: 10 })).toEqual([]);
    expect(await matchesApi.listChampionStats(bob, account.id, "ALL")).toEqual([]);
    expect(await matchesApi.listRoleStats(bob, account.id, "ALL")).toEqual([]);
    expect(await matchesApi.listMatchups(bob, account.id, "ALL")).toEqual([]);
    expect(
      await ranksApi.listRankHistory(bob, account.id, "RANKED_SOLO_5x5", { limit: 10 }),
    ).toEqual([]);
    expect(await matchesApi.listKnownMatchIds(bob, account.id, ids(41))).toEqual([]);
    expect(await matchesApi.findPlayedMatch(bob, ids(41)[0]!)).toBeNull();
    expect(await matchesApi.saveMatchTimeline(bob, ids(41)[0]!, { version: 1 })).toBe(false);
    expect(await matchesApi.saveMatchTimeline(alice, ids(41)[0]!, { version: 1 })).toBe(true);
    expect(await matchesApi.findPlayedMatch(alice, ids(41)[0]!)).toMatchObject({
      accountId: account.id,
    });
    expect(await ranksApi.listLatestRanks(bob, account.id)).toEqual([]);
    expect(await ranksApi.recordRanks(bob, account.id, [])).toBe(false);
    expect(await accountsApi.findRiotAccount(bob, account.id)).toBeNull();
    expect(
      await accountsApi.updateRiotAccountProfile(bob, account.id, {
        profileIconId: 1,
        summonerLevel: 1,
      }),
    ).toBe(false);
    expect(
      await accountsApi.markRiotAccountVerified(bob, account.id, {
        puuid: "x",
        gameName: "x",
        tagLine: "x",
      }),
    ).toBe(false);
  });

  it("deux utilisateurs qui suivent le même joueur partagent la partie, pas la performance", async () => {
    const alice = await newUser();
    const bob = await newUser();
    const aliceAccount = await link(alice);
    const bobAccount = await link(bob);
    const shared = fakeApi({ matchIds: ids(51) });

    await sync.syncRiotAccount(alice, aliceAccount.id, { api: shared.api, now: at(0) });
    const result = await sync.syncRiotAccount(bob, bobAccount.id, { api: shared.api, now: at(0) });
    expect(result).toEqual({ ok: true, newMatches: 1, partial: false });

    await usersApi.deleteUser(alice);
    const played = await matchesApi.listPlayedMatches(bob, bobAccount.id, { limit: 10 });
    expect(played.map((match) => match.matchId)).toEqual(ids(51));
  });

  it("refuse de lier deux fois le même joueur sous deux Riot ID", async () => {
    const user = await newUser();
    const first = await link(user, "Ancien");
    const second = await link(user, "Nouveau");
    const { api, puuid } = fakeApi({ matchIds: [] });
    await sync.syncRiotAccount(user, first.id, { api, now: at(0) });

    const same = fakeApi({ puuid, matchIds: [] });
    expect(await sync.syncRiotAccount(user, second.id, { api: same.api, now: at(0) })).toEqual({
      ok: false,
      reason: "player_already_linked",
    });
  });
});
