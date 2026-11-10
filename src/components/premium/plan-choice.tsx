"use client";

import { useState } from "react";

import { t } from "@/i18n/fr";
import type { CheckoutConfig } from "@/lib/billing/paddle";
import {
  BILLING_INTERVALS,
  formatPremiumPrice,
  formatYearlyPerMonth,
  yearlySavingPercent,
  type BillingInterval,
} from "@/lib/billing/plans";
import { cn } from "@/lib/cn";

import { CheckoutButton } from "./checkout-button";

const copy = t.premium;

type PlanChoiceProps = {
  /** `null` : le paiement n'est pas encore ouvert, on montre seulement le prix. */
  config: CheckoutConfig | null;
  email: string;
  userId: string;
  /** Abonné : seul le prix de son abonnement s'affiche, sans choix ni paiement. */
  subscribed: boolean;
  /** Fondateur au prix garanti : le mois affiché est le sien (2,99 €). */
  founder?: boolean;
  initialInterval: BillingInterval;
};

/**
 * Le prix de Premium et, quand l'annuel est proposé, le choix de la durée.
 * Le bouton de paiement ouvre le prix choisi.
 */
export function PlanChoice({
  config,
  email,
  userId,
  subscribed,
  founder = false,
  initialInterval,
}: PlanChoiceProps) {
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  const offered = BILLING_INTERVALS.filter((each) => config?.prices[each]);
  const priceId = config?.prices[interval];
  const canChoose = !subscribed && offered.length > 1;

  return (
    <div className="flex flex-col gap-5">
      {canChoose ? (
        <fieldset className="flex min-w-0 flex-col">
          <legend className="sr-only">{copy.interval.legend}</legend>
          <div className="flex flex-wrap gap-1.5">
            {offered.map((each) => {
              const checked = each === interval;
              return (
                <div key={each}>
                  <input
                    id={`interval-${each}`}
                    type="radio"
                    name="interval"
                    value={each}
                    checked={checked}
                    onChange={() => setInterval(each)}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={`interval-${each}`}
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center gap-2 rounded-pill border px-3.5 text-sm font-semibold select-none",
                      "[transition:scale_var(--duration-slow)_var(--ease-spring),color_var(--duration-fast)_var(--ease-out),border-color_var(--duration-fast)_var(--ease-out),background-color_var(--duration-fast)_var(--ease-out)]",
                      "active:scale-[0.94] active:[transition-duration:var(--duration-press)]",
                      checked
                        ? "border-ink bg-ink/10 text-ink"
                        : "border-line-strong text-ink-muted hover:border-ink-faint hover:text-ink",
                      "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                    )}
                  >
                    {copy.interval[each]}
                    {each === "year" ? (
                      <span className="text-win tabular">
                        {copy.interval.saving(yearlySavingPercent({ founder }))}
                      </span>
                    ) : null}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="flex items-baseline gap-2">
          <span className="display text-6xl text-ink tabular">
            {formatPremiumPrice(interval, { founder })}
          </span>
          <span className="text-ink-muted">
            {interval === "year" ? copy.perYear : copy.perMonth}
          </span>
        </p>
        <p className="text-ink-muted">
          {interval === "year" ? copy.yearlyNote(formatYearlyPerMonth()) : copy.noCommitment}
        </p>
      </div>

      {subscribed ? null : config && priceId ? (
        <CheckoutButton config={config} priceId={priceId} email={email} userId={userId} />
      ) : (
        <p className="text-ink-muted">{copy.notReady}</p>
      )}
    </div>
  );
}
