/**
 * Les prix de Premium, tels qu'ils sont affichés. Le montant facturé est celui
 * des prix configurés chez Paddle (`PADDLE_PRICE_ID`, `PADDLE_PRICE_ID_YEARLY`,
 * `PADDLE_PRICE_ID_FOUNDERS`) : ils doivent concorder.
 *
 * 3,99 € depuis novembre 2026 (audit financier) : à 2,99 €, TVA et frais fixes
 * de Paddle prenaient la moitié du prix. Les fondateurs gardent 2,99 € à vie.
 */
export const PREMIUM_PRICES = {
  /** En centimes, TTC. */
  month: { amountCents: 399 },
  /** 2,50 € par mois : les frais fixes de Paddle ne sont payés qu'une fois. */
  year: { amountCents: 2999 },
} as const;

/** Le prix au mois garanti aux fondateurs (comptes venus par invitation), en centimes TTC. */
export const FOUNDERS_MONTH_CENTS = 299;

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

/** Le prix au mois payé : celui des fondateurs pour eux, sinon le prix public. */
const monthCents = (founder: boolean) =>
  founder ? FOUNDERS_MONTH_CENTS : PREMIUM_PRICES.month.amountCents;

/** « 3,99 € » (par mois, « 2,99 € » pour un fondateur) ou « 29,99 € » (par an). */
export function formatPremiumPrice(
  interval: BillingInterval = "month",
  { founder = false }: { founder?: boolean } = {},
): string {
  return euros(interval === "month" ? monthCents(founder) : PREMIUM_PRICES.year.amountCents);
}

/** L'annuel ramené au mois : « 2,50 € ». */
export function formatYearlyPerMonth(): string {
  return euros(Math.round(PREMIUM_PRICES.year.amountCents / 12));
}

/**
 * Ce que l'annuel fait gagner sur douze mois payés au mois, en pourcentage
 * arrondi : 37 au prix public, 16 pour un fondateur.
 */
export function yearlySavingPercent({ founder = false }: { founder?: boolean } = {}): number {
  const twelveMonths = monthCents(founder) * 12;
  return Math.round((1 - PREMIUM_PRICES.year.amountCents / twelveMonths) * 100);
}
