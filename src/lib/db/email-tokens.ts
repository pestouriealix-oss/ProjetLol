import "server-only";
import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "./client";
import { emailTokens, users } from "./schema";

/**
 * Jetons des liens envoyés par e-mail. Le jeton en clair ne quitte ce module
 * que pour partir dans l'e-mail ; la base n'en garde que l'empreinte.
 */

export type EmailTokenKind = (typeof emailTokens.$inferSelect)["kind"];

/** Durée de validité d'un lien, selon son usage. */
export const TOKEN_TTL_MINUTES: Record<EmailTokenKind, number> = {
  VERIFY_EMAIL: 48 * 60,
  RESET_PASSWORD: 30,
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Crée un lien pour cet utilisateur et cette adresse. Les liens précédents du
 * même usage, encore inutilisés, sont annulés : seul le dernier e-mail compte.
 */
export async function issueEmailToken(
  userId: string,
  kind: EmailTokenKind,
  email: string,
  now = new Date(),
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MINUTES[kind] * 60_000);
  await db.transaction(async (tx) => {
    await tx
      .delete(emailTokens)
      .where(
        and(eq(emailTokens.userId, userId), eq(emailTokens.kind, kind), isNull(emailTokens.usedAt)),
      );
    await tx.insert(emailTokens).values({
      userId,
      kind,
      email,
      tokenHash: hashToken(token),
      expiresAt,
    });
  });
  return token;
}

/**
 * Utilise un lien : une seule fois, avant expiration, et seulement si
 * l'adresse du compte n'a pas changé depuis l'envoi. Renvoie l'utilisateur
 * concerné, ou `null` si le lien ne vaut rien.
 *
 * Exception assumée à la règle « `userId` en premier » : le jeton est le
 * secret qui désigne l'utilisateur, il n'y a pas de session à ce moment-là.
 */
export async function consumeEmailToken(
  kind: EmailTokenKind,
  token: string,
  now = new Date(),
): Promise<{ userId: string; email: string } | null> {
  if (!token) return null;
  const [used] = await db
    .update(emailTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(emailTokens.tokenHash, hashToken(token)),
        eq(emailTokens.kind, kind),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, now),
      ),
    )
    .returning({ userId: emailTokens.userId, email: emailTokens.email });
  if (!used) return null;

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, used.userId))
    .limit(1);
  if (!user || user.email !== used.email) return null;
  return used;
}

/** Vrai si le lien existe, n'a pas servi et n'a pas expiré (sans l'utiliser). */
export async function isEmailTokenValid(
  kind: EmailTokenKind,
  token: string,
  now = new Date(),
): Promise<boolean> {
  if (!token) return false;
  const [row] = await db
    .select({ id: emailTokens.id })
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.tokenHash, hashToken(token)),
        eq(emailTokens.kind, kind),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, now),
      ),
    )
    .limit(1);
  return row !== undefined;
}
