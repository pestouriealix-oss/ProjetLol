import "server-only";
import { and, asc, count, eq, gt, isNotNull, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "./client";
import { accounts, invites, users, waitlistEntries } from "./schema";

/**
 * Test fermé : codes d'invitation et liste d'attente.
 *
 * Exception assumée à la règle « `userId` en premier » : ces données
 * précèdent le compte (une adresse sur la liste, un code pas encore utilisé).
 * Elles ne sont lues que par l'inscription et par le script d'invitation,
 * jamais affichées à un autre utilisateur.
 */

/** Un code encore utilisable : des places restantes, et pas expiré. */
const usable = (now: Date) =>
  and(lt(invites.uses, invites.maxUses), or(isNull(invites.expiresAt), gt(invites.expiresAt, now)));

/** Enregistre des codes (déjà normalisés). */
export async function createInvites(
  codes: string[],
  options: { note?: string | null; maxUses?: number; expiresAt?: Date | null } = {},
): Promise<{ id: string; code: string }[]> {
  if (codes.length === 0) return [];
  return db
    .insert(invites)
    .values(
      codes.map((code) => ({
        code,
        note: options.note ?? null,
        maxUses: options.maxUses ?? 1,
        expiresAt: options.expiresAt ?? null,
      })),
    )
    .returning({ id: invites.id, code: invites.code });
}

/** Vrai si le code existe et peut encore servir (sans l'utiliser). */
export async function isInviteUsable(code: string, now = new Date()): Promise<boolean> {
  const [row] = await db
    .select({ id: invites.id })
    .from(invites)
    .where(and(eq(invites.code, code), usable(now)))
    .limit(1);
  return row !== undefined;
}

/**
 * Prend une place sur le code, d'un seul coup (deux inscriptions simultanées
 * ne peuvent pas dépasser le nombre de places). Renvoie l'invitation, ou
 * `null` si le code ne vaut rien.
 */
export async function consumeInvite(code: string, now = new Date()): Promise<string | null> {
  const [row] = await db
    .update(invites)
    .set({ uses: sql`${invites.uses} + 1` })
    .where(and(eq(invites.code, code), usable(now)))
    .returning({ id: invites.id });
  return row?.id ?? null;
}

/** L'invitation qui porte ce code, utilisable ou non. */
export async function findInviteId(code: string): Promise<string | null> {
  const [row] = await db
    .select({ id: invites.id })
    .from(invites)
    .where(eq(invites.code, code))
    .limit(1);
  return row?.id ?? null;
}

/** Rend la place prise si l'inscription a échoué ensuite (adresse déjà prise…). */
export async function releaseInvite(inviteId: string): Promise<void> {
  await db
    .update(invites)
    .set({ uses: sql`greatest(${invites.uses} - 1, 0)` })
    .where(eq(invites.id, inviteId));
}

/** Retient le code utilisé par un compte créé via Discord. */
export async function attachInviteToUser(userId: string, inviteId: string): Promise<void> {
  await db.update(users).set({ inviteId }).where(eq(users.id, userId));
}

/** Vrai si ce compte Discord (ou autre fournisseur) est déjà lié à un utilisateur. */
export async function hasLinkedAccount(provider: string, providerAccountId: string) {
  const [row] = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)))
    .limit(1);
  return row !== undefined;
}

/** Ajoute une adresse à la liste d'attente ; une adresse déjà inscrite garde sa place. */
export async function joinWaitlist(
  email: string,
  source: string | null,
  now = new Date(),
): Promise<"added" | "already"> {
  const inserted = await db
    .insert(waitlistEntries)
    .values({ email: email.toLowerCase(), source, consentAt: now })
    .onConflictDoNothing({ target: waitlistEntries.email })
    .returning({ id: waitlistEntries.id });
  return inserted.length > 0 ? "added" : "already";
}

/** Les plus anciens inscrits de la liste qui n'ont pas encore reçu d'invitation. */
export async function nextWaitlistEntries(limit: number) {
  return db
    .select({ id: waitlistEntries.id, email: waitlistEntries.email })
    .from(waitlistEntries)
    .where(isNull(waitlistEntries.invitedAt))
    .orderBy(asc(waitlistEntries.createdAt))
    .limit(limit);
}

/** Note qu'une personne de la liste a reçu son code. */
export async function markWaitlistInvited(
  entryId: string,
  inviteId: string,
  now = new Date(),
): Promise<void> {
  await db
    .update(waitlistEntries)
    .set({ invitedAt: now, inviteId })
    .where(eq(waitlistEntries.id, entryId));
}

/**
 * Offre fondateurs : Premium offert jusqu'à `endsAt` aux comptes venus par
 * invitation qui ne l'ont pas encore reçu. Renvoie le nombre de comptes.
 */
export async function grantFounderTrials(endsAt: Date): Promise<number> {
  const updated = await db
    .update(users)
    .set({ premiumTrialEndsAt: endsAt })
    .where(and(isNotNull(users.inviteId), isNull(users.premiumTrialEndsAt)))
    .returning({ id: users.id });
  return updated.length;
}

/** Où en est le test fermé : la liste, les invitations envoyées, les codes utilisés. */
export async function closedTestSummary() {
  const [waiting] = await db
    .select({ value: count() })
    .from(waitlistEntries)
    .where(isNull(waitlistEntries.invitedAt));
  const [invited] = await db
    .select({ value: count() })
    .from(waitlistEntries)
    .where(isNotNull(waitlistEntries.invitedAt));
  const [registered] = await db
    .select({ value: count() })
    .from(users)
    .where(isNotNull(users.inviteId));
  const [codes] = await db
    .select({ value: count(), used: sql<number>`coalesce(sum(${invites.uses}), 0)::int` })
    .from(invites);
  return {
    waiting: waiting?.value ?? 0,
    invited: invited?.value ?? 0,
    registered: registered?.value ?? 0,
    codes: codes?.value ?? 0,
    codeUses: codes?.used ?? 0,
  };
}
