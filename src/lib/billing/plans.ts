/**
 * Le prix de Premium, tel qu'il est affiché. Le montant facturé est celui du
 * prix configuré chez Paddle (`PADDLE_PRICE_ID`) : les deux doivent concorder.
 */
export const PREMIUM_PRICE = {
  /** En centimes, TTC. */
  amountCents: 299,
  currency: "EUR",
  interval: "month",
} as const;

/** « 2,99 € » */
export function formatPremiumPrice(): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: PREMIUM_PRICE.currency,
  }).format(PREMIUM_PRICE.amountCents / 100);
}
