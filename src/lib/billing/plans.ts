/**
 * Les prix de Premium, tels qu'ils sont affichés. Le montant facturé est celui
 * des prix configurés chez Paddle (`PADDLE_PRICE_ID`, `PADDLE_PRICE_ID_YEARLY`) :
 * les deux doivent concorder.
 */
export const PREMIUM_PRICES = {
  /** En centimes, TTC. */
  month: { amountCents: 299 },
  /** Environ 2,08 € par mois : les frais fixes de Paddle ne sont payés qu'une fois. */
  year: { amountCents: 2499 },
} as const;

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

/** « 2,99 € » (par mois) ou « 24,99 € » (par an). */
export function formatPremiumPrice(interval: BillingInterval = "month"): string {
  return euros(PREMIUM_PRICES[interval].amountCents);
}

/** L'annuel ramené au mois : « 2,08 € ». */
export function formatYearlyPerMonth(): string {
  return euros(Math.round(PREMIUM_PRICES.year.amountCents / 12));
}

/** Ce que l'annuel fait gagner sur douze mois payés au mois, en pourcentage arrondi : 30. */
export function yearlySavingPercent(): number {
  const twelveMonths = PREMIUM_PRICES.month.amountCents * 12;
  return Math.round((1 - PREMIUM_PRICES.year.amountCents / twelveMonths) * 100);
}
