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

export async function findRiotAccount(
  userId: string,
  accountId: string,
): Promise<RiotAccount | null> {
  const [account] = await db.select().from(riotAccounts).where(owned(userId, accountId)).limit(1);
  return account ?? null;
}

/** Un même joueur Riot est déjà lié à cet utilisateur sous un autre Riot ID. */
export class RiotPlayerAlreadyLinkedError extends Error {
  constructor() {
    super("riot_player_already_linked");
    this.name = "RiotPlayerAlreadyLinkedError";
  }
}

/**
 * Enregistre l'identité confirmée par Riot : l'identifiant stable du joueur et
 * l'écriture exacte de son Riot ID.
 */
export async function markRiotAccountVerified(
  userId: string,
  accountId: string,
  identity: { puuid: string; gameName: string; tagLine: string },
): Promise<boolean> {
  try {
    const updated = await db
      .update(riotAccounts)
      .set({ ...identity, verifiedAt: new Date() })
      .where(owned(userId, accountId))
      .returning({ id: riotAccounts.id });
    return updated.length > 0;
  } catch (error) {
    if (isUniqueViolation(error)) throw new RiotPlayerAlreadyLinkedError();
    throw error;
  }
}

/**
 * Lie un compte dont l'identité vient de Riot Sign On (le joueur s'est
 * connecté chez Riot) : il est vérifié d'office. Un compte déjà lié au même
 * joueur, ou au même Riot ID, est mis à jour plutôt que dupliqué. Renvoie le
 * compte et s'il vient d'être créé.
 */
export async function linkVerifiedRiotAccount(
  userId: string,
  identity: { puuid: string; gameName: string; tagLine: string; platform: Platform },
  options: { maxAccounts: number },
): Promise<{ account: RiotAccount; created: boolean }> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);

    const sameRiotId = and(
      eq(riotAccounts.platform, identity.platform),
      sql`lower(${riotAccounts.gameName}) = lower(${identity.gameName})`,
      sql`lower(${riotAccounts.tagLine}) = lower(${identity.tagLine})`,
    );
    const [existing] = await tx
      .select({ id: riotAccounts.id })
      .from(riotAccounts)
      .where(
        and(
          eq(riotAccounts.userId, userId),
          sql`(${riotAccounts.puuid} = ${identity.puuid} or (${sameRiotId}))`,
        ),
      )
      .orderBy(sql`${riotAccounts.puuid} = ${identity.puuid} desc nulls last`)
      .limit(1);

    if (existing) {
      const [updated] = await tx
        .update(riotAccounts)
        .set({ ...identity, verifiedAt: new Date() })
        .where(owned(userId, existing.id))
        .returning();
      return { account: updated!, created: false };
    }

    const [row] = await tx
      .select({ value: count() })
      .from(riotAccounts)
      .where(eq(riotAccounts.userId, userId));
    const total = row?.value ?? 0;
    if (total >= options.maxAccounts) throw new RiotAccountLimitError();

    const [created] = await tx
      .insert(riotAccounts)
      .values({ userId, ...identity, roles: [], isPrimary: total === 0, verifiedAt: new Date() })
      .returning();
    return { account: created!, created: true };
  });
}

/** Icône d'invocateur et niveau du compte, tels que Riot les donne. */
export async function updateRiotAccountProfile(
  userId: string,
  accountId: string,
  profile: { profileIconId: number; summonerLevel: number },
): Promise<boolean> {
  const updated = await db
    .update(riotAccounts)
    .set(profile)
    .where(owned(userId, accountId))
    .returning({ id: riotAccounts.id });
  return updated.length > 0;
}

export async function markRiotAccountSynced(
  userId: string,
  accountId: string,
  at: Date,
): Promise<void> {
  await db.update(riotAccounts).set({ lastSyncedAt: at }).where(owned(userId, accountId));
}

function isUniqueViolation(error: unknown): boolean {
  for (let current: unknown = error; current; current = (current as { cause?: unknown }).cause) {
    if ((current as { code?: unknown }).code === "23505") return true;
  }
  return false;
}
