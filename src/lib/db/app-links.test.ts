/**
 * Liaison de l'app Overwolf, sur une vraie base PostgreSQL.
 * Ignorés si DATABASE_URL n'est pas définie.
 */
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateInviteCode } from "@/lib/auth/invite-code";

import type * as LinksApi from "./app-links";
import type * as UsersApi from "./users";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("liaison de l'app Overwolf", () => {
  let api: typeof LinksApi;
  let usersApi: typeof UsersApi;
  let userId: string;

  beforeAll(async () => {
    api = await import("./app-links");
    usersApi = await import("./users");
    const user = await usersApi.createUserWithPassword({
      email: `app-${randomUUID()}@example.test`,
      name: "app",
      passwordHash: "non-utilisé",
    });
    userId = user.id;
  });

  afterAll(async () => {
    await usersApi.deleteUser(userId);
  });

  it("attend la validation, donne le jeton une seule fois, puis le jeton désigne le compte", async () => {
    const { deviceCode, userCode } = await api.createAppLinkRequest();
    expect(userCode).toMatch(/^[A-Z2-9]{8}$/);

    expect(await api.exchangeAppLinkRequest(deviceCode)).toEqual({ status: "pending" });
    expect(await api.approveAppLinkRequest(userId, userCode)).toBe(true);

    const exchange = await api.exchangeAppLinkRequest(deviceCode);
    expect(exchange.status).toBe("approved");
    // La demande est consommée : un second échange ne rend rien.
    expect(await api.exchangeAppLinkRequest(deviceCode)).toEqual({ status: "expired" });

    const token = exchange.status === "approved" ? exchange.token : "";
    const found = await api.findAppToken(token);
    expect(found?.userId).toBe(userId);
    expect(await api.findAppToken(`${token.slice(0, -1)}x`)).toBeNull();
  });

  it("un code expiré ne se valide plus", async () => {
    const past = new Date(Date.now() - 11 * 60 * 1000);
    const { deviceCode, userCode } = await api.createAppLinkRequest(past);

    expect(await api.approveAppLinkRequest(userId, userCode)).toBe(false);
    expect(await api.exchangeAppLinkRequest(deviceCode)).toEqual({ status: "expired" });
  });

  it("tire un autre code si le premier est déjà pris", async () => {
    const taken = generateInviteCode();
    const free = generateInviteCode();
    const codes = [taken, taken, free];
    const first = await api.createAppLinkRequest(new Date(), () => taken);
    const second = await api.createAppLinkRequest(new Date(), () => codes.shift() ?? free);
    expect(first.userCode).toBe(taken);
    expect(second.userCode).toBe(free);
  });

  it("couper l'accès rend le jeton inutilisable", async () => {
    const { deviceCode, userCode } = await api.createAppLinkRequest();
    await api.approveAppLinkRequest(userId, userCode);
    const exchange = await api.exchangeAppLinkRequest(deviceCode);
    const token = exchange.status === "approved" ? exchange.token : "";
    const found = await api.findAppToken(token);

    expect(await api.revokeAppToken(userId, found!.id)).toBe(true);
    expect(await api.findAppToken(token)).toBeNull();
  });
});
