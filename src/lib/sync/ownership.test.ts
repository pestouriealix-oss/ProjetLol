/**
 * Preuve de propriété d'un compte Riot : le choix de l'icône (pur), puis le
 * parcours complet sur une vraie base PostgreSQL et une fausse API Riot
 * (ignoré si DATABASE_URL n'est pas définie).
 */
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type * as RiotAccountsApi from "@/lib/db/riot-accounts";
import type * as UsersApi from "@/lib/db/users";
import type { RiotApi } from "@/lib/riot/api";
import { RiotApiError } from "@/lib/riot/errors";

import type * as OwnershipApi from "./ownership";

describe("pickChallengeIcon", () => {
  it("choisit une icône de départ, jamais celle déjà affichée", async () => {
    const { pickChallengeIcon, STARTER_ICON_COUNT } = await import("./ownership");
    for (let step = 0; step < 50; step += 1) {
      const icon = pickChallengeIcon(7, () => step / 50);
      expect(icon).not.toBe(7);
      expect(icon).toBeGreaterThanOrEqual(0);
      expect(icon).toBeLessThan(STARTER_ICON_COUNT);
    }
    // Une icône hors des icônes de départ n'exclut rien.
    expect(pickChallengeIcon(4568, () => 0)).toBe(0);
  });
});

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("preuve de propriété d'un compte Riot", () => {
  let ownership: typeof OwnershipApi;
  let accountsApi: typeof RiotAccountsApi;
  let usersApi: typeof UsersApi;
  const users: string[] = [];

  const newUser = async () => {
    const user = await usersApi.createUserWithPassword({
      email: `test-owner-${randomUUID()}@example.test`,
      name: null,
      passwordHash: "non-utilisé",
    });
    users.push(user.id);
    return user.id;
  };

  /** Fausse API : un joueur dont on change l'icône à la main. */
  function fakeApi(options: { unknown?: boolean } = {}) {
    const player = { puuid: `puuid-${randomUUID()}`, icon: 4568 };
    const notUsed = async () => {
      throw new Error("non utilisé dans ces tests");
    };
    const api = {
      async getAccountByRiotId(_platform: string, gameName: string, tagLine: string) {
        if (options.unknown) throw new RiotApiError("not_found", "Inconnu.");
        return { puuid: player.puuid, gameName, tagLine };
      },
      async getSummoner(_platform: string, puuid: string) {
        return { puuid, profileIconId: player.icon, summonerLevel: 120 };
      },
      getMatchTimeline: notUsed,
      getActiveGame: notUsed,
      getLadderPage: notUsed,
      getApexLadder: notUsed,
      getSoloMatchIds: notUsed,
      getLeagueEntries: notUsed,
      getRankedMatchIds: notUsed,
      getMatch: notUsed,
    } as unknown as RiotApi;
    return { api, player };
  }

  const at = (minutes: number) => () => new Date(Date.UTC(2026, 10, 5, 12) + minutes * 60_000);

  const link = (userId: string) =>
    accountsApi.addRiotAccount(
      userId,
      { gameName: "Joueur", tagLine: "TEST", platform: "EUW1", roles: [] },
      { maxAccounts: 3 },
    );

  beforeAll(async () => {
    ownership = await import("./ownership");
    accountsApi = await import("@/lib/db/riot-accounts");
    usersApi = await import("@/lib/db/users");
  });

  afterAll(async () => {
    for (const userId of users) await usersApi.deleteUser(userId);
  });

  it("confirme le compte une fois l'icône demandée en place", async () => {
    const userId = await newUser();
    const account = await link(userId);
    const { api, player } = fakeApi();

    const started = await ownership.startOwnershipChallenge(userId, account.id, {
      api,
      now: at(0),
      random: () => 0.5,
    });
    if (!started.ok || started.status !== "pending") throw new Error("preuve non demandée");
    expect(started.expiresAt).toEqual(at(ownership.CHALLENGE_MINUTES)());

    // Revenir sur la page ne change pas l'icône demandée.
    const again = await ownership.startOwnershipChallenge(userId, account.id, {
      api,
      now: at(2),
      random: () => 0,
    });
    expect(again).toMatchObject({ status: "pending", iconId: started.iconId });

    // Icône pas encore changée : refusé, le compte reste à confirmer.
    expect(
      await ownership.confirmOwnershipChallenge(userId, account.id, { api, now: at(3) }),
    ).toEqual({ ok: false, reason: "icon_mismatch", seenIconId: 4568 });

    player.icon = started.iconId;
    expect(
      await ownership.confirmOwnershipChallenge(userId, account.id, { api, now: at(4) }),
    ).toEqual({ ok: true });
    const owned = await accountsApi.findRiotAccount(userId, account.id);
    expect(owned).toMatchObject({ puuid: player.puuid, ownershipIconId: null });
    expect(owned?.ownedAt).toEqual(at(4)());
  });

  it("refuse une preuve expirée, et le compte d'un autre", async () => {
    const userId = await newUser();
    const other = await newUser();
    const account = await link(userId);
    const { api, player } = fakeApi();

    const started = await ownership.startOwnershipChallenge(userId, account.id, {
      api,
      now: at(0),
    });
    if (!started.ok || started.status !== "pending") throw new Error("preuve non demandée");
    player.icon = started.iconId;

    expect(
      await ownership.confirmOwnershipChallenge(other, account.id, { api, now: at(1) }),
    ).toEqual({ ok: false, reason: "account_missing" });
    expect(await ownership.startOwnershipChallenge(other, account.id, { api, now: at(1) })).toEqual(
      { ok: false, reason: "account_missing" },
    );

    const tooLate = at(ownership.CHALLENGE_MINUTES + ownership.LATE_GRACE_MINUTES + 1);
    expect(
      await ownership.confirmOwnershipChallenge(userId, account.id, { api, now: tooLate }),
    ).toEqual({ ok: false, reason: "expired" });
    expect((await accountsApi.findRiotAccount(userId, account.id))?.ownedAt).toBeNull();
  });

  it("accepte l'icône que Riot montre en retard, et garde la même icône si on recommence", async () => {
    const userId = await newUser();
    const account = await link(userId);
    const { api, player } = fakeApi();

    const started = await ownership.startOwnershipChallenge(userId, account.id, {
      api,
      now: at(0),
      random: () => 0.3,
    });
    if (!started.ok || started.status !== "pending") throw new Error("preuve non demandée");

    // Délai passé, Riot montre toujours l'ancienne icône : à recommencer…
    const late = at(ownership.CHALLENGE_MINUTES + 5);
    expect(
      await ownership.confirmOwnershipChallenge(userId, account.id, { api, now: late }),
    ).toEqual({ ok: false, reason: "expired" });
    // … avec la même icône, que le joueur a peut-être déjà mise.
    const again = await ownership.startOwnershipChallenge(userId, account.id, {
      api,
      now: late,
      random: () => 0.9,
    });
    expect(again).toMatchObject({ status: "pending", iconId: started.iconId });

    // Riot finit par la montrer, même après l'heure : c'est une preuve.
    player.icon = started.iconId;
    const muchLater = at(ownership.CHALLENGE_MINUTES * 3);
    expect(
      await ownership.confirmOwnershipChallenge(userId, account.id, { api, now: muchLater }),
    ).toEqual({ ok: true });
  });

  it("confirme tout de suite si l'icône demandée est déjà en place", async () => {
    const userId = await newUser();
    const account = await link(userId);
    const { api, player } = fakeApi();

    const started = await ownership.startOwnershipChallenge(userId, account.id, {
      api,
      now: at(0),
    });
    if (!started.ok || started.status !== "pending") throw new Error("preuve non demandée");
    player.icon = started.iconId;
    expect(
      await ownership.startOwnershipChallenge(userId, account.id, { api, now: at(1) }),
    ).toEqual({ ok: true, status: "owned" });
    expect((await accountsApi.findRiotAccount(userId, account.id))?.ownedAt).toEqual(at(1)());
  });

  it("dit quand Riot ne connaît pas ce Riot ID", async () => {
    const userId = await newUser();
    const account = await link(userId);
    const { api } = fakeApi({ unknown: true });
    expect(await ownership.startOwnershipChallenge(userId, account.id, { api })).toEqual({
      ok: false,
      reason: "player_unknown",
    });
  });
});
