/**
 * Tests d'intégration sur une vraie base PostgreSQL : ils vérifient qu'un
 * utilisateur ne peut jamais lire ni modifier les données d'un autre.
 * Ignorés si DATABASE_URL n'est pas définie (d'où les imports dynamiques : le
 * client de base refuse de se charger sans elle).
 */
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type * as RiotAccountsApi from "./riot-accounts";
import type * as UsersApi from "./users";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("isolation des données entre utilisateurs", () => {
  let api: typeof RiotAccountsApi;
  let usersApi: typeof UsersApi;
  let alice: string;
  let bob: string;

  const newUser = async (label: string) => {
    const user = await usersApi.createUserWithPassword({
      email: `test-${label}-${randomUUID()}@example.test`,
      name: label,
      passwordHash: "non-utilisé",
    });
    return user.id;
  };

  const input = (gameName: string) => ({
    gameName,
    tagLine: "TEST",
    platform: "EUW1" as const,
    roles: ["JUNGLE" as const],
  });

  beforeAll(async () => {
    api = await import("./riot-accounts");
    usersApi = await import("./users");
    alice = await newUser("alice");
    bob = await newUser("bob");
  });

  afterAll(async () => {
    await usersApi.deleteUser(alice);
    await usersApi.deleteUser(bob);
  });

  it("chaque utilisateur ne voit que ses comptes", async () => {
    await api.addRiotAccount(alice, input("AliceMain"), { maxAccounts: 5 });
    await api.addRiotAccount(bob, input("BobMain"), { maxAccounts: 5 });

    const aliceAccounts = await api.listRiotAccounts(alice);
    const bobAccounts = await api.listRiotAccounts(bob);

    expect(aliceAccounts.map((account) => account.gameName)).toEqual(["AliceMain"]);
    expect(bobAccounts.map((account) => account.gameName)).toEqual(["BobMain"]);
  });

  it("un utilisateur ne peut pas modifier, promouvoir ou supprimer le compte d'un autre", async () => {
    const [bobAccount] = await api.listRiotAccounts(bob);
    if (!bobAccount) throw new Error("compte de Bob introuvable");

    expect(await api.updateRiotAccountRoles(alice, bobAccount.id, ["TOP"])).toBe(false);
    expect(await api.setPrimaryRiotAccount(alice, bobAccount.id)).toBe(false);
    expect(await api.removeRiotAccount(alice, bobAccount.id)).toBe(false);

    const [unchanged] = await api.listRiotAccounts(bob);
    expect(unchanged).toMatchObject({ id: bobAccount.id, roles: ["JUNGLE"], isPrimary: true });
  });

  it("le même Riot ID peut être lié par deux utilisateurs, mais pas deux fois par le même", async () => {
    await api.addRiotAccount(alice, input("Shared"), { maxAccounts: 5 });
    await expect(
      api.addRiotAccount(bob, input("Shared"), { maxAccounts: 5 }),
    ).resolves.toBeDefined();
    await expect(
      api.addRiotAccount(alice, input("shared"), { maxAccounts: 5 }),
    ).rejects.toBeInstanceOf(api.DuplicateRiotAccountError);
  });

  it("la limite de comptes tient même avec des ajouts simultanés", async () => {
    const carol = await newUser("carol");
    try {
      const results = await Promise.allSettled(
        ["One", "Two", "Three", "Four"].map((name) =>
          api.addRiotAccount(carol, input(`Carol${name}`), { maxAccounts: 2 }),
        ),
      );
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
      for (const result of results) {
        if (result.status === "rejected") {
          expect(result.reason).toBeInstanceOf(api.RiotAccountLimitError);
        }
      }

      const accounts = await api.listRiotAccounts(carol);
      expect(accounts).toHaveLength(2);
      expect(accounts.filter((account) => account.isPrimary)).toHaveLength(1);
    } finally {
      await usersApi.deleteUser(carol);
    }
  });

  it("retirer le compte principal promeut le suivant", async () => {
    const dave = await newUser("dave");
    try {
      const first = await api.addRiotAccount(dave, input("DaveOne"), { maxAccounts: 5 });
      const second = await api.addRiotAccount(dave, input("DaveTwo"), { maxAccounts: 5 });
      expect(first.isPrimary).toBe(true);
      expect(second.isPrimary).toBe(false);

      expect(await api.removeRiotAccount(dave, first.id)).toBe(true);

      const remaining = await api.listRiotAccounts(dave);
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toMatchObject({ id: second.id, isPrimary: true });
    } finally {
      await usersApi.deleteUser(dave);
    }
  });

  it("supprimer un utilisateur supprime ses comptes Riot", async () => {
    const erin = await newUser("erin");
    await api.addRiotAccount(erin, input("ErinMain"), { maxAccounts: 5 });
    await usersApi.deleteUser(erin);
    expect(await api.listRiotAccounts(erin)).toEqual([]);
  });

  it("chaque utilisateur ne voit et ne compte que ses fiches de draft", async () => {
    const drafts = await import("./draft-analyses");
    const [bobAccount] = await api.listRiotAccounts(bob);
    const analysis = {
      patch: "16.20",
      myChampion: "LeeSin",
      myRole: "JUNGLE" as const,
      allies: {},
      enemies: {},
      content: {},
      promptVersion: "test@1",
    };
    // Alice ne peut pas rattacher sa fiche au compte Riot de Bob.
    const aliceId = await drafts.createDraftAnalysis(alice, {
      ...analysis,
      riotAccountId: bobAccount?.id ?? null,
    });
    const bobId = await drafts.createDraftAnalysis(bob, { ...analysis, riotAccountId: null });

    expect((await drafts.findDraftAnalysis(alice, aliceId))?.riotAccountId).toBeNull();
    expect(await drafts.findDraftAnalysis(alice, bobId)).toBeNull();
    expect(await drafts.findDraftAnalysis(bob, aliceId)).toBeNull();
    expect((await drafts.listDraftAnalyses(alice, { limit: 10 })).map((row) => row.id)).toEqual([
      aliceId,
    ]);
    const today = new Date(Date.now() - 60_000);
    expect(await drafts.countDraftAnalysesSince(alice, today)).toBe(1);
    expect(await drafts.countDraftAnalysesSince(bob, today)).toBe(1);
  });

  it("chaque utilisateur ne compte que sa propre consommation du modèle", async () => {
    const usages = await import("./llm-usages");
    const since = new Date(Date.now() - 60_000);
    const usage = {
      model: "claude-sonnet-5-5",
      inputTokens: 3000,
      outputTokens: 1000,
      cacheWriteTokens: 0,
      cacheReadTokens: 500,
    };
    await usages.recordLlmUsage(alice, "DRAFT_ANALYSIS", usage);
    await usages.recordLlmUsage(alice, "DRAFT_ANALYSIS", usage);
    await usages.recordLlmUsage(bob, "DRAFT_EXTRACTION", usage);

    const aliceSum = await usages.sumLlmUsage(alice, since);
    expect(aliceSum.calls).toBe(2);
    expect(aliceSum.costMicroUsd).toBe(2 * (3000 * 2 + 1000 * 10 + 500 * 0.1));
    expect((await usages.sumLlmUsage(bob, since)).calls).toBe(1);
    expect(await usages.siteLlmSpendSince(since)).toBeGreaterThanOrEqual(3 * 16050);
  });

  it("chaque utilisateur ne lit, ne compte et n'écrit que ses bilans de partie", async () => {
    const matchesApi = await import("./matches");
    const reviews = await import("./match-reviews");
    const [aliceAccount] = await api.listRiotAccounts(alice);
    if (!aliceAccount) throw new Error("compte d'Alice introuvable");
    const matchId = `TEST_${randomUUID()}`;
    await matchesApi.saveMatchForAccount(alice, aliceAccount.id, {
      platform: "EUW1",
      summary: {
        id: matchId,
        patch: "16.20",
        queueId: 420,
        startedAt: new Date(),
        durationSeconds: 1800,
      },
      details: {},
      participation: {
        championId: 64,
        championName: "LeeSin",
        role: "JUNGLE",
        side: "BLUE",
        win: true,
        kills: 5,
        deaths: 2,
        assists: 9,
        cs: 180,
        gold: 11_000,
        damageToChampions: 15_000,
        visionScore: 30,
        killParticipation: 0.6,
        stats: { level: 15, teamKills: 23, items: [], opponentChampion: "Ivern" },
      },
    });
    const review = {
      summary: "Bon début de partie.",
      focus: "Moins de deux morts avant 15 minutes.",
      strengths: [],
      improvements: [],
      facts: {},
      promptVersion: "test@1",
    };

    // Bob n'a pas joué cette partie : il ne peut ni y écrire un bilan, ni lire celui d'Alice.
    expect(await reviews.saveMatchReview(bob, matchId, review)).toBeNull();
    const id = await reviews.saveMatchReview(alice, matchId, review);
    expect(id).not.toBeNull();
    expect((await reviews.findMatchReview(alice, matchId))?.id).toBe(id);
    expect(await reviews.findMatchReview(bob, matchId)).toBeNull();

    // Réécrire le bilan le remplace au lieu d'en ajouter un.
    await reviews.saveMatchReview(alice, matchId, { ...review, summary: "Relu." });
    expect((await reviews.findMatchReview(alice, matchId))?.summary).toBe("Relu.");
    const since = new Date(Date.now() - 60_000);
    expect(await reviews.countMatchReviewsSince(alice, since)).toBe(1);
    expect(await reviews.countMatchReviewsSince(bob, since)).toBe(0);
  });

  it("un abonnement ne concerne que son utilisateur et règle son offre", async () => {
    const billing = await import("./billing");
    const subscriptionId = `sub_test_${randomUUID()}`;
    const customerId = `ctm_test_${randomUUID()}`;
    await billing.saveBillingCustomer(alice, customerId);
    expect(await billing.findUserIdByCustomer(customerId)).toBe(alice);
    expect(await billing.findBillingCustomer(bob)).toBeNull();

    const base = {
      id: subscriptionId,
      priceId: "pri_test",
      currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
      cancelAt: null,
    };
    const t0 = new Date();
    expect(await billing.saveSubscription(alice, { ...base, status: "active", eventAt: t0 })).toBe(
      "PREMIUM",
    );
    expect((await usersApi.findUserById(alice))?.plan).toBe("PREMIUM");
    expect((await usersApi.findUserById(bob))?.plan).toBe("FREE");
    expect(await billing.findCurrentSubscription(bob)).toBeNull();

    // Bob ne peut pas s'approprier l'abonnement d'Alice.
    await expect(
      billing.saveSubscription(bob, { ...base, status: "active", eventAt: new Date() }),
    ).rejects.toThrow();

    // Une notification plus ancienne n'écrase pas l'état récent ; une plus récente, si.
    const earlier = new Date(t0.getTime() - 60_000);
    await billing.saveSubscription(alice, { ...base, status: "canceled", eventAt: earlier });
    expect((await billing.findCurrentSubscription(alice))?.status).toBe("active");
    const later = new Date(t0.getTime() + 60_000);
    expect(
      await billing.saveSubscription(alice, { ...base, status: "canceled", eventAt: later }),
    ).toBe("FREE");
    expect((await usersApi.findUserById(alice))?.plan).toBe("FREE");
  });

  it("Riot Sign On lie un compte vérifié, sans doublon, et seulement pour son utilisateur", async () => {
    const identity = {
      puuid: `rso-${randomUUID()}`,
      gameName: "RsoPlayer",
      tagLine: "RSO",
      platform: "EUW1" as const,
    };
    const first = await api.linkVerifiedRiotAccount(bob, identity, { maxAccounts: 10 });
    expect(first.created).toBe(true);
    expect(first.account.verifiedAt).not.toBeNull();

    // Même joueur, Riot ID changé : le compte est mis à jour, pas dupliqué.
    const renamed = await api.linkVerifiedRiotAccount(
      bob,
      { ...identity, gameName: "Renamed" },
      { maxAccounts: 10 },
    );
    expect(renamed).toMatchObject({ created: false, account: { id: first.account.id } });
    expect((await api.findRiotAccount(bob, first.account.id))?.gameName).toBe("Renamed");

    // Alice peut lier le même joueur de son côté, sans toucher au compte de Bob.
    const alices = await api.linkVerifiedRiotAccount(alice, identity, { maxAccounts: 10 });
    expect(alices.account.userId).toBe(alice);
    expect(alices.account.id).not.toBe(first.account.id);

    // Le même Riot ID, mais un autre joueur (le pseudo a changé de main) : rien n'est écrasé.
    await expect(
      api.linkVerifiedRiotAccount(
        bob,
        { ...identity, gameName: "Renamed", puuid: `rso-${randomUUID()}` },
        { maxAccounts: 10 },
      ),
    ).rejects.toBeInstanceOf(api.RiotIdTakenError);
    expect((await api.findRiotAccount(bob, first.account.id))?.puuid).toBe(identity.puuid);

    await expect(
      api.linkVerifiedRiotAccount(
        bob,
        { ...identity, puuid: `rso-${randomUUID()}`, gameName: "Other" },
        { maxAccounts: 1 },
      ),
    ).rejects.toBeInstanceOf(api.RiotAccountLimitError);
  });

  it("refuse un second compte avec le même e-mail", async () => {
    const email = `test-dup-${randomUUID()}@example.test`;
    const first = await usersApi.createUserWithPassword({ email, name: null, passwordHash: "x" });
    try {
      await expect(
        usersApi.createUserWithPassword({ email, name: null, passwordHash: "y" }),
      ).rejects.toBeInstanceOf(usersApi.EmailTakenError);
    } finally {
      await usersApi.deleteUser(first.id);
    }
  });
});
