import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { SUBSCRIPTION_STATUSES, type SubscriptionStatus } from "@/lib/config";

/**
 * Notifications de Paddle : vérification de la signature, puis lecture des
 * seuls champs utiles. Fonctions pures, testées sans réseau.
 */

/** Écart toléré entre l'horodatage signé et l'heure du serveur (rejoue une vieille notification sinon). */
export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

/**
 * Vrai si l'en-tête `Paddle-Signature` (« ts=…;h1=… ») signe bien ce corps
 * brut avec ce secret. Plusieurs `h1` peuvent coexister pendant une rotation
 * du secret : un seul suffit.
 */
export function verifyPaddleSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  now: Date = new Date(),
): boolean {
  if (!header) return false;
  let timestamp: string | undefined;
  const signatures: string[] = [];
  for (const part of header.split(";")) {
    const [key, value] = part.split("=", 2);
    if (key === "ts") timestamp = value;
    else if (key === "h1" && value) signatures.push(value);
  }
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  if (Math.abs(now.getTime() / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}:${rawBody}`, "utf8").digest();
  return signatures.some((signature) => {
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

const customData = z
  .looseObject({ userId: z.string().min(1).optional() })
  .nullable()
  .optional()
  .catch(null);

const subscriptionData = z.looseObject({
  id: z.string().startsWith("sub_"),
  status: z.enum(SUBSCRIPTION_STATUSES),
  customer_id: z.string().startsWith("ctm_"),
  custom_data: customData,
  items: z
    .array(z.looseObject({ price: z.looseObject({ id: z.string() }).nullable().optional() }))
    .optional()
    .default([]),
  current_billing_period: z.looseObject({ ends_at: z.string() }).nullable().optional(),
  scheduled_change: z
    .looseObject({ action: z.string(), effective_at: z.string() })
    .nullable()
    .optional(),
});

const transactionData = z.looseObject({
  customer_id: z.string().startsWith("ctm_").nullable().optional(),
  custom_data: customData,
});

const eventSchema = z.looseObject({
  event_type: z.string(),
  occurred_at: z.string(),
  data: z.unknown(),
});

export type PaddleEvent =
  | {
      kind: "subscription";
      occurredAt: Date;
      subscription: {
        id: string;
        status: SubscriptionStatus;
        customerId: string;
        userId: string | null;
        priceId: string | null;
        currentPeriodEnd: Date | null;
        cancelAt: Date | null;
      };
    }
  | { kind: "customer"; customerId: string; userId: string }
  | { kind: "ignored"; eventType: string };

/** Lit une notification Paddle déjà authentifiée. Lève une erreur si elle est illisible. */
export function readPaddleEvent(body: unknown): PaddleEvent {
  const event = eventSchema.parse(body);
  if (event.event_type.startsWith("subscription.")) {
    const data = subscriptionData.parse(event.data);
    return {
      kind: "subscription",
      occurredAt: new Date(event.occurred_at),
      subscription: {
        id: data.id,
        status: data.status,
        customerId: data.customer_id,
        userId: data.custom_data?.userId ?? null,
        priceId: data.items[0]?.price?.id ?? null,
        currentPeriodEnd: data.current_billing_period
          ? new Date(data.current_billing_period.ends_at)
          : null,
        cancelAt:
          data.scheduled_change?.action === "cancel"
            ? new Date(data.scheduled_change.effective_at)
            : null,
      },
    };
  }
  if (event.event_type === "transaction.completed") {
    const data = transactionData.parse(event.data);
    if (data.customer_id && data.custom_data?.userId) {
      return { kind: "customer", customerId: data.customer_id, userId: data.custom_data.userId };
    }
  }
  return { kind: "ignored", eventType: event.event_type };
}
