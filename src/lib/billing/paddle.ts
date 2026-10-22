import "server-only";
import { z } from "zod";

import { env } from "@/lib/env";

/**
 * Paddle, le service de paiement de Premium. Paddle est le vendeur officiel
 * (« merchant of record ») : il encaisse, facture et reverse la TVA de chaque
 * pays. Le site ne voit jamais de carte bancaire.
 */

const API_BASE_URL = {
  sandbox: "https://sandbox-api.paddle.com",
  production: "https://api.paddle.com",
} as const;

/** Ce que la page de paiement doit connaître (rien de secret). */
export type CheckoutConfig = {
  environment: "sandbox" | "production";
  clientToken: string;
  priceId: string;
};

/** La configuration du paiement dans la page, ou `null` si Paddle n'est pas branché. */
export function checkoutConfig(): CheckoutConfig | null {
  if (!env.PADDLE_CLIENT_TOKEN || !env.PADDLE_PRICE_ID) return null;
  return {
    environment: env.PADDLE_ENV,
    clientToken: env.PADDLE_CLIENT_TOKEN,
    priceId: env.PADDLE_PRICE_ID,
  };
}

/** Vrai si les notifications de Paddle peuvent être vérifiées. */
export const webhookSecret = (): string | null => env.PADDLE_WEBHOOK_SECRET ?? null;

const portalSessionSchema = z.object({
  data: z.object({
    urls: z.object({ general: z.object({ overview: z.string().url() }) }),
  }),
});

const apiBase = () => env.PADDLE_API_BASE_URL ?? API_BASE_URL[env.PADDLE_ENV];

/** Résilie un abonnement tout de suite (suppression du compte Kairos). */
export async function cancelSubscriptionNow(subscriptionId: string): Promise<void> {
  if (!env.PADDLE_API_KEY) throw new Error("PADDLE_API_KEY n'est pas définie.");
  if (!/^sub_[a-z0-9_]+$/i.test(subscriptionId)) throw new Error("Abonnement Paddle invalide.");
  const response = await fetch(`${apiBase()}/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ effective_from: "immediately" }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Paddle a répondu ${response.status} à la résiliation.`);
}

/**
 * Lien vers le portail client de Paddle (factures, moyen de paiement,
 * résiliation), valable quelques minutes : à ouvrir aussitôt, jamais à garder.
 */
export async function createPortalUrl(customerId: string): Promise<string> {
  if (!env.PADDLE_API_KEY) throw new Error("PADDLE_API_KEY n'est pas définie.");
  if (!/^ctm_[a-z0-9_]+$/i.test(customerId)) throw new Error("Client Paddle invalide.");
  const response = await fetch(`${apiBase()}/customers/${customerId}/portal-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Paddle a répondu ${response.status} au portail client.`);
  return portalSessionSchema.parse(await response.json()).data.urls.general.overview;
}
