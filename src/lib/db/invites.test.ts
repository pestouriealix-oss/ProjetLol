/**
 * Codes d'invitation et liste d'attente, sur une vraie base PostgreSQL.
 * Ignorés si DATABASE_URL n'est pas définie.
 */
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateInviteCode } from "@/lib/auth/invite-code";

import type * as InvitesApi from "./invites";
import type * as UsersApi from "./users";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("test fermé : invitations et liste d'attente", () => {
  let api: typeof InvitesApi;
  let usersApi: typeof UsersApi;
  const createdUsers: string[] = [];

  /** Un code tiré au hasard, comme le script d'invitation. */
  const freshCode = () => generateInviteCode();

  beforeAll(async () => {
    api = await import("./invites");
    usersApi = await import("./users");
  });

  afterAll(async () => {
    for (const id of createdUsers) await usersApi.deleteUser(id);
  });

  it("un code à une place ne sert qu'une fois, même demandé deux fois en même temps", async () => {
    const code = freshCode();
    await api.createInvites([code]);

    expect(await api.isInviteUsable(code)).toBe(true);
    const results = await Promise.all([api.consumeInvite(code), api.consumeInvite(code)]);
    expect(results.filter((id) => id !== null)).toHaveLength(1);
    expect(await api.isInviteUsable(code)).toBe(false);
    expect(await api.consumeInvite(code)).toBeNull();
  });

  it("un code à plusieurs places sert jusqu'à la dernière, et rend une place perdue", async () => {
    const code = freshCode();
    await api.createInvites([code], { maxUses: 2 });

    const first = await api.consumeInvite(code);
    expect(first).not.toBeNull();
    expect(await api.consumeInvite(code)).toBe(first);
    expect(await api.consumeInvite(code)).toBeNull();

    // Inscription ratée après coup : la place revient.
    await api.releaseInvite(first!);
    expect(await api.consumeInvite(code)).toBe(first);
  });

  it("un code expiré ou inconnu ne vaut rien", async () => {
    const code = freshCode();
    const now = new Date();
    await api.createInvites([code], { expiresAt: new Date(now.getTime() - 1000) });

    expect(await api.isInviteUsable(code, now)).toBe(false);
    expect(await api.consumeInvite(code, now)).toBeNull();
    expect(await api.consumeInvite(freshCode(), now)).toBeNull();
  });

  it("le compte créé garde la trace de son invitation", async () => {
    const code = freshCode();
    await api.createInvites([code], { note: "test" });
    const inviteId = await api.consumeInvite(code);
    const user = await usersApi.createUserWithPassword({
      email: `invite-${randomUUID()}@example.test`,
      name: null,
      passwordHash: "non-utilisé",
      inviteId,
    });
    createdUsers.push(user.id);

    expect(await api.findInviteId(code)).toBe(inviteId);
    const summary = await api.closedTestSummary();
    expect(summary.registered).toBeGreaterThanOrEqual(1);
  });

  it("une adresse ne s'inscrit qu'une fois sur la liste, sans tenir compte des majuscules", async () => {
    const email = `liste-${randomUUID()}@example.test`;

    expect(await api.joinWaitlist(email, "createur")).toBe("added");
    expect(await api.joinWaitlist(email.toUpperCase(), null)).toBe("already");

    const next = await api.nextWaitlistEntries(1000);
    const entry = next.find((row) => row.email === email);
    expect(entry).toBeDefined();

    const code = freshCode();
    const [invite] = await api.createInvites([code]);
    await api.markWaitlistInvited(entry!.id, invite!.id);
    const after = await api.nextWaitlistEntries(1000);
    expect(after.some((row) => row.email === email)).toBe(false);
  });

  it("offre Premium aux seuls fondateurs, une fois", async () => {
    const [invite] = await api.createInvites([freshCode()]);
    const founder = await usersApi.createUserWithPassword({
      email: `fondateur-${randomUUID()}@example.test`,
      name: null,
      passwordHash: "non-utilisé",
      inviteId: invite!.id,
    });
    const other = await usersApi.createUserWithPassword({
      email: `autre-${randomUUID()}@example.test`,
      name: null,
      passwordHash: "non-utilisé",
    });
    createdUsers.push(founder.id, other.id);

    const endsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    expect(await api.grantFounderTrials(endsAt)).toBeGreaterThanOrEqual(1);
    expect(await api.grantFounderTrials(endsAt)).toBe(0);

    const founderNow = await usersApi.findUserById(founder.id);
    expect(founderNow).toMatchObject({ plan: "PREMIUM", founder: true });
    expect(founderNow?.trialEndsAt?.getTime()).toBe(endsAt.getTime());
    expect(await usersApi.findUserById(other.id)).toMatchObject({
      plan: "FREE",
      founder: false,
      trialEndsAt: null,
    });
  });
});
