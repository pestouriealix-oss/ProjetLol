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
