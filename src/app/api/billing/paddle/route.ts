import { webhookSecret } from "@/lib/billing/paddle";
import { readPaddleEvent, verifyPaddleSignature } from "@/lib/billing/webhook";
import { findUserIdByCustomer, saveBillingCustomer, saveSubscription } from "@/lib/db/billing";
import { findUserById } from "@/lib/db/users";

/**
 * Notifications de Paddle (paiement, abonnement créé, renouvelé, résilié…).
 * Pas de session ici : c'est Paddle qui appelle, authentifié par la
 * signature du corps. L'offre de l'utilisateur suit l'état de son abonnement.
 *
 * Réponses : 200 traité ou ignoré, 401 signature invalide, 400 illisible,
 * 503 non configuré, 500 erreur (Paddle réessaie plus tard).
 */
export async function POST(request: Request) {
  const secret = webhookSecret();
  if (!secret) return new Response("Notifications Paddle non configurées.", { status: 503 });

  const rawBody = await request.text();
  if (!verifyPaddleSignature(rawBody, request.headers.get("paddle-signature"), secret)) {
    return new Response("Signature invalide.", { status: 401 });
  }

  let event: ReturnType<typeof readPaddleEvent>;
  try {
    event = readPaddleEvent(JSON.parse(rawBody));
  } catch (error) {
    console.error("Notification Paddle illisible", error);
    return new Response("Notification illisible.", { status: 400 });
  }

  if (event.kind === "customer") {
    // Le paiement porte l'utilisateur dans ses données : on retient son client Paddle.
    if (await findUserById(event.userId)) {
      await saveBillingCustomer(event.userId, event.customerId);
    }
    return new Response(null, { status: 200 });
  }

  if (event.kind === "subscription") {
    const { subscription } = event;
    const userId =
      subscription.userId && (await findUserById(subscription.userId))
        ? subscription.userId
        : await findUserIdByCustomer(subscription.customerId);
    if (!userId) {
      // Un client inconnu (compte supprimé, paiement fait ailleurs) : rien à mettre à jour.
      console.warn("Abonnement Paddle sans utilisateur connu", subscription.id);
      return new Response(null, { status: 200 });
    }
    await saveBillingCustomer(userId, subscription.customerId);
    await saveSubscription(userId, {
      id: subscription.id,
      status: subscription.status,
      priceId: subscription.priceId,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAt: subscription.cancelAt,
      eventAt: event.occurredAt,
    });
  }

  return new Response(null, { status: 200 });
}
