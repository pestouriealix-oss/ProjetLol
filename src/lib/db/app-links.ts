import "server-only";
import { createHash, randomBytes } from "node:crypto";

import { and, desc, eq, gt, isNotNull, isNull, lt, or } from "drizzle-orm";

import { generateInviteCode } from "@/lib/auth/invite-code";

import { db } from "./client";
import { appLinkRequests, appTokens } from "./schema";

/**
 * L'app Overwolf et le compte Gufo : liaison par code court, puis jeton.
 *
 * Les secrets en clair (secret de l'app, jeton) ne quittent ce module que
 * pour partir vers l'app ; la base n'en garde que l'empreinte.
 */

export const LINK_TTL_MINUTES = 10;
/** On ne réécrit pas la date de dernière utilisation à chaque appel. */
const TOUCH_EVERY_MS = 60 * 60 * 1000;
const APP_NAME = "App Overwolf";

const hash = (secret: string) => createHash("sha256").update(secret).digest("hex");
const newSecret = () => randomBytes(32).toString("base64url");

/**
 * Nouvelle demande de liaison : le secret reste dans l'app, le code court
 * s'affiche pour être validé sur le site. Les demandes expirées sont effacées
 * au passage.
 *
 * Exception assumée à la règle « `userId` en premier » : la demande précède
 * la connexion, elle ne désigne encore aucun compte.
 */
export async function createAppLinkRequest(
  now = new Date(),
  pickCode: () => string = () => generateInviteCode(),
): Promise<{ deviceCode: string; userCode: string; expiresAt: Date }> {
  await db.delete(appLinkRequests).where(lt(appLinkRequests.expiresAt, now));
  const expiresAt = new Date(now.getTime() + LINK_TTL_MINUTES * 60_000);
  // Deux demandes en cours ne peuvent pas avoir le même code : on retire au sort.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const deviceCode = newSecret();
    const userCode = pickCode();
    const inserted = await db
      .insert(appLinkRequests)
      .values({ deviceCodeHash: hash(deviceCode), userCode, expiresAt })
      .onConflictDoNothing({ target: appLinkRequests.userCode })
      .returning({ id: appLinkRequests.id });
    if (inserted.length > 0) return { deviceCode, userCode, expiresAt };
  }
  throw new Error("Impossible de tirer un code de liaison libre.");
}

/**
 * Le joueur connecté valide le code affiché par l'app. Faux si le code est
 * inconnu, expiré ou déjà validé.
 */
export async function approveAppLinkRequest(
  userId: string,
  userCode: string,
  now = new Date(),
): Promise<boolean> {
  const updated = await db
    .update(appLinkRequests)
    .set({ userId, approvedAt: now })
    .where(
      and(
        eq(appLinkRequests.userCode, userCode),
        isNull(appLinkRequests.approvedAt),
        gt(appLinkRequests.expiresAt, now),
      ),
    )
    .returning({ id: appLinkRequests.id });
  return updated.length > 0;
}

export type AppLinkExchange =
  { status: "pending" } | { status: "expired" } | { status: "approved"; token: string };

/**
 * L'app échange son secret contre un jeton, une seule fois, dès que le code
 * a été validé. La demande est effacée à l'échange.
 *
 * Exception assumée à la règle « `userId` en premier » : le secret de l'app
 * désigne la demande, et c'est elle qui porte le compte.
 */
export async function exchangeAppLinkRequest(
  deviceCode: string,
  now = new Date(),
): Promise<AppLinkExchange> {
  const deviceCodeHash = hash(deviceCode);
  return db.transaction(async (tx) => {
    const [claimed] = await tx
      .delete(appLinkRequests)
      .where(
        and(
          eq(appLinkRequests.deviceCodeHash, deviceCodeHash),
          isNotNull(appLinkRequests.approvedAt),
          isNotNull(appLinkRequests.userId),
          gt(appLinkRequests.expiresAt, now),
        ),
      )
      .returning({ userId: appLinkRequests.userId });
    if (claimed?.userId) {
      const token = newSecret();
      await tx.insert(appTokens).values({
        userId: claimed.userId,
        tokenHash: hash(token),
        name: APP_NAME,
        lastUsedAt: now,
      });
      return { status: "approved", token };
    }
    const [waiting] = await tx
      .select({ id: appLinkRequests.id })
      .from(appLinkRequests)
      .where(
        and(eq(appLinkRequests.deviceCodeHash, deviceCodeHash), gt(appLinkRequests.expiresAt, now)),
      )
      .limit(1);
    return waiting ? { status: "pending" } : { status: "expired" };
  });
}

/**
 * Le compte derrière un jeton d'app, ou `null` si le jeton ne vaut rien.
 *
 * Exception assumée à la règle « `userId` en premier » : le jeton est le
 * secret qui désigne l'utilisateur, comme un cookie de session.
 */
export async function findAppToken(
  token: string,
  now = new Date(),
): Promise<{ id: string; userId: string; createdAt: Date } | null> {
  if (!token) return null;
  const [row] = await db
    .select({
      id: appTokens.id,
      userId: appTokens.userId,
      createdAt: appTokens.createdAt,
      lastUsedAt: appTokens.lastUsedAt,
    })
    .from(appTokens)
    .where(eq(appTokens.tokenHash, hash(token)))
    .limit(1);
  if (!row) return null;
  const stale = new Date(now.getTime() - TOUCH_EVERY_MS);
  if (!row.lastUsedAt || row.lastUsedAt < stale) {
    await db
      .update(appTokens)
      .set({ lastUsedAt: now })
      .where(
        and(
          eq(appTokens.id, row.id),
          or(isNull(appTokens.lastUsedAt), lt(appTokens.lastUsedAt, stale)),
        ),
      );
  }
  return { id: row.id, userId: row.userId, createdAt: row.createdAt };
}

export type AppTokenSummary = {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

/** Les apps reliées au compte, la plus récente d'abord. */
export async function listAppTokens(userId: string): Promise<AppTokenSummary[]> {
  return db
    .select({
      id: appTokens.id,
      name: appTokens.name,
      createdAt: appTokens.createdAt,
      lastUsedAt: appTokens.lastUsedAt,
    })
    .from(appTokens)
    .where(eq(appTokens.userId, userId))
    .orderBy(desc(appTokens.createdAt));
}

/** Coupe l'accès d'une app reliée. Faux si elle n'appartient pas au compte. */
export async function revokeAppToken(userId: string, tokenId: string): Promise<boolean> {
  const deleted = await db
    .delete(appTokens)
    .where(and(eq(appTokens.userId, userId), eq(appTokens.id, tokenId)))
    .returning({ id: appTokens.id });
  return deleted.length > 0;
}
