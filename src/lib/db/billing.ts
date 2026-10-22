import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import type { Plan, SubscriptionStatus } from "@/lib/config";

import { db } from "./client";
import { billingCustomers, subscriptions, users } from "./schema";

/**
 * Abonnements payants (Paddle). L'offre de l'utilisateur (`users.plan`) est
 * recalculée à chaque changement d'abonnement : Premium tant qu'un abonnement
 * est actif, en essai ou en retard de paiement (Paddle relance alors le
 * paiement avant de résilier).
 */

const PREMIUM_STATUSES: SubscriptionStatus[] = ["active", "trialing", "past_due"];

export type StoredSubscription = {
  id: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
};

/**
 * Associe le client Paddle à l'utilisateur (le dernier connu l'emporte).
 * Renvoie `false` si ce client appartient déjà à un autre utilisateur.
 */
export async function saveBillingCustomer(userId: string, customerId: string): Promise<boolean> {
  try {
    await db
      .insert(billingCustomers)
      .values({ userId, customerId })
      .onConflictDoUpdate({ target: billingCustomers.userId, set: { customerId } });
    return true;
  } catch (error) {
    // Ce client Paddle est déjà celui d'un autre utilisateur : on ne le déplace pas.
    if ((error as { cause?: { code?: string } }).cause?.code === "23505") return false;
    throw error;
  }
}

/** Le client Paddle de l'utilisateur, s'il a déjà payé. */
export async function findBillingCustomer(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ customerId: billingCustomers.customerId })
    .from(billingCustomers)
    .where(eq(billingCustomers.userId, userId))
    .limit(1);
  return row?.customerId ?? null;
}

/**
 * L'utilisateur d'un client Paddle. Sert uniquement aux notifications de
 * Paddle, qui ne connaissent que leur propre identifiant : aucune donnée de
 * l'utilisateur n'en sort, seulement son identifiant.
 */
export async function findUserIdByCustomer(customerId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: billingCustomers.userId })
    .from(billingCustomers)
    .where(eq(billingCustomers.customerId, customerId))
    .limit(1);
  return row?.userId ?? null;
}

/**
 * Enregistre l'état d'un abonnement de l'utilisateur, sauf si un état plus
 * récent est déjà connu (Paddle ne garantit pas l'ordre des notifications),
 * puis recalcule son offre. Renvoie l'offre qui en résulte.
 */
export async function saveSubscription(
  userId: string,
  subscription: StoredSubscription & { priceId: string | null; eventAt: Date },
): Promise<Plan> {
  return db.transaction(async (tx) => {
    // Un abonnement ne change jamais de propriétaire.
    const [existing] = await tx
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.id, subscription.id))
      .limit(1);
    if (existing && existing.userId !== userId) {
      throw new Error("Abonnement rattaché à un autre utilisateur.");
    }

    await tx
      .insert(subscriptions)
      .values({ ...subscription, userId })
      .onConflictDoUpdate({
        target: subscriptions.id,
        set: {
          status: subscription.status,
          priceId: subscription.priceId,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAt: subscription.cancelAt,
          eventAt: subscription.eventAt,
        },
        setWhere: sql`${subscriptions.eventAt} <= excluded.event_at`,
      });

    const [premium] = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, PREMIUM_STATUSES)))
      .limit(1);
    const plan: Plan = premium ? "PREMIUM" : "FREE";
    await tx.update(users).set({ plan }).where(eq(users.id, userId));
    return plan;
  });
}

/** L'abonnement le plus récent de l'utilisateur, pour l'afficher. */
export async function findCurrentSubscription(userId: string): Promise<StoredSubscription | null> {
  const [row] = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAt: subscriptions.cancelAt,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.eventAt))
    .limit(1);
  return row ?? null;
}
