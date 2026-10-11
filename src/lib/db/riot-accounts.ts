import "server-only";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import type { Platform, Role } from "@/lib/config";

import { db } from "./client";
import { riotAccounts, type RiotAccount } from "./schema";

/**
 * Accès aux comptes Riot. Chaque fonction prend `userId` en premier argument et
 * l'inclut dans sa clause WHERE : un utilisateur ne peut ni lire ni modifier le
 * compte d'un autre, même en devinant un identifiant.
 */

export class DuplicateRiotAccountError extends Error {
  constructor() {
    super("duplicate_riot_account");
    this.name = "DuplicateRiotAccountError";
  }
}

export class RiotAccountLimitError extends Error {
  constructor() {
    super("riot_account_limit");
    this.name = "RiotAccountLimitError";
  }
}

const owned = (userId: string, accountId: string) =>
  and(eq(riotAccounts.id, accountId), eq(riotAccounts.userId, userId));

export async function listRiotAccounts(userId: string): Promise<RiotAccount[]> {
  return db
    .select()
    .from(riotAccounts)
    .where(eq(riotAccounts.userId, userId))
    .orderBy(desc(riotAccounts.isPrimary), asc(riotAccounts.createdAt));
}

export async function countRiotAccounts(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(riotAccounts)
    .where(eq(riotAccounts.userId, userId));
  return row?.value ?? 0;
}

export async function addRiotAccount(
  userId: string,
  input: { gameName: string; tagLine: string; platform: Platform; roles: Role[] },
  options: { maxAccounts: number },
): Promise<RiotAccount> {
  return db.transaction(async (tx) => {
    // Verrou par utilisateur : deux ajouts simultanés ne peuvent pas tous deux
    // passer sous la limite ni créer deux comptes principaux.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);

    const [row] = await tx
      .select({ value: count() })
      .from(riotAccounts)
      .where(eq(riotAccounts.userId, userId));
    const existing = row?.value ?? 0;
    if (existing >= options.maxAccounts) throw new RiotAccountLimitError();

    const [created] = await tx
      .insert(riotAccounts)
      .values({ userId, ...input, isPrimary: existing === 0 })
      .onConflictDoNothing()
      .returning();
    if (!created) throw new DuplicateRiotAccountError();
    return created;
  });
}

/** Renvoie `false` si le compte n'existe pas ou n'appartient pas à l'utilisateur. */
export async function updateRiotAccountRoles(
  userId: string,
  accountId: string,
  roles: Role[],
): Promise<boolean> {
  const updated = await db
    .update(riotAccounts)
    .set({ roles })
    .where(owned(userId, accountId))
    .returning({ id: riotAccounts.id });
  return updated.length > 0;
}

export async function setPrimaryRiotAccount(userId: string, accountId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);

    const [target] = await tx
      .select({ id: riotAccounts.id })
      .from(riotAccounts)
      .where(owned(userId, accountId))
      .limit(1);
    if (!target) return false;

    await tx
      .update(riotAccounts)
      .set({ isPrimary: sql`${riotAccounts.id} = ${accountId}` })
      .where(eq(riotAccounts.userId, userId));
    return true;
  });
}

export async function removeRiotAccount(userId: string, accountId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);

    const [removed] = await tx
      .delete(riotAccounts)
      .where(owned(userId, accountId))
      .returning({ isPrimary: riotAccounts.isPrimary });
    if (!removed) return false;

    // Le compte principal vient d'être retiré : le plus ancien restant prend le relais.
    if (removed.isPrimary) {
      const [next] = await tx
        .select({ id: riotAccounts.id })
        .from(riotAccounts)
        .where(eq(riotAccounts.userId, userId))
        .orderBy(asc(riotAccounts.createdAt))
        .limit(1);
      if (next) {
        await tx.update(riotAccounts).set({ isPrimary: true }).where(eq(riotAccounts.id, next.id));
      }
    }
    return true;
  });
}
