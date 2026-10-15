import "server-only";
import { createHash } from "node:crypto";

import { and, eq, gt, gte, sql } from "drizzle-orm";

import { db } from "./client";
import { authAttempts } from "./schema";

/**
 * Limitation des essais de connexion et d'inscription. Ces compteurs ne sont
 * rattachés à aucun utilisateur : ils protègent les comptes contre les essais
 * de mots de passe en série, et le service contre les inscriptions en masse.
 */

/** Empreinte d'une clé (« login:e-mail », « ip:adresse »…) : rien n'est stocké en clair. */
export function attemptKey(kind: string, value: string): string {
  return createHash("sha256").update(`${kind}:${value.trim().toLowerCase()}`).digest("hex");
}

/** Vrai si la clé a atteint `max` essais dans sa fenêtre en cours. */
export async function isRateLimited(key: string, max: number, now = new Date()): Promise<boolean> {
  const [row] = await db
    .select({ key: authAttempts.key })
    .from(authAttempts)
    .where(
      and(eq(authAttempts.key, key), gt(authAttempts.resetAt, now), gte(authAttempts.count, max)),
    )
    .limit(1);
  return row !== undefined;
}

/**
 * Compte un essai. La fenêtre démarre au premier essai et dure
 * `windowSeconds` ; une fois passée, le compteur repart de un. Renvoie le
 * nombre d'essais dans la fenêtre.
 */
export async function recordAttempt(
  key: string,
  windowSeconds: number,
  now = new Date(),
): Promise<number> {
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const [row] = await db
    .insert(authAttempts)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: authAttempts.key,
      set: {
        count: sql`case when ${authAttempts.resetAt} <= ${now} then 1 else ${authAttempts.count} + 1 end`,
        resetAt: sql`case when ${authAttempts.resetAt} <= ${now} then ${resetAt} else ${authAttempts.resetAt} end`,
      },
    })
    .returning({ count: authAttempts.count });
  return row?.count ?? 1;
}

/** Efface le compteur (après une connexion réussie). */
export async function clearAttempts(key: string): Promise<void> {
  await db.delete(authAttempts).where(eq(authAttempts.key, key));
}
