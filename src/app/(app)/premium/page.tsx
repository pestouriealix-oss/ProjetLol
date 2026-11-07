import { Check, Gift } from "lucide-react";
import type { Metadata } from "next";

import { ActivationWatch } from "@/components/premium/activation-watch";
import { PlanChoice } from "@/components/premium/plan-choice";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";
import { isPaidPlan, limitsFor } from "@/lib/auth/entitlements";
import { requireUser } from "@/lib/auth/session";
import { checkoutConfig, intervalOfPrice } from "@/lib/billing/paddle";
import { formatPremiumPrice } from "@/lib/billing/plans";
import { findCurrentSubscription } from "@/lib/db/billing";
import { formatLongDate } from "@/lib/format";

import { openBillingPortal } from "./actions";

export const metadata: Metadata = { title: t.premium.title };

const copy = t.premium;

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ merci?: string; portail?: string }>;
}) {
  const user = await requireUser();
  const { merci, portail } = await searchParams;
  const subscription = await findCurrentSubscription(user.id);
  const config = checkoutConfig({ founder: user.founder });
  // Premium offert (fondateurs) : on peut s'abonner pendant, rien n'est payé.
  const subscribed = isPaidPlan(user.plan) && user.trialEndsAt === null;
  const free = limitsFor("FREE");
  const paid = limitsFor("PREMIUM");

  const rows = [
    { label: copy.compare.sheets, free: free.draftAnalysesPerDay, paid: paid.draftAnalysesPerDay },
    { label: copy.compare.reviews, free: free.matchReviewsPerDay, paid: paid.matchReviewsPerDay },
    { label: copy.compare.accounts, free: free.riotAccounts, paid: paid.riotAccounts },
  ];

  return (
    <PageShell route="premium" title={copy.title}>
      <header className="flex max-w-[60ch] flex-col gap-3">
        <h2 className="display text-3xl text-ink sm:text-4xl">{copy.headline}</h2>
        <p className="text-lg text-ink-muted">{copy.lede}</p>
      </header>

      {user.trialEndsAt ? (
        <Panel role="status" className="flex items-start gap-3 border-win/40 bg-win-soft px-5 py-4">
          <Gift aria-hidden className="mt-1 size-5 shrink-0 text-win" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-ink">
              {copy.trial.title(formatLongDate(user.trialEndsAt))}
            </p>
            <p className="text-ink-muted">{copy.trial.body}</p>
          </div>
        </Panel>
      ) : null}

      {merci && !subscribed ? (
        <Panel role="status" className="border-win/40 bg-win-soft px-5 py-4 text-ink">
          {copy.thanks}
          <ActivationWatch />
        </Panel>
      ) : null}

      <Panel className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col gap-5">
          {user.founder ? (
            <p className="flex flex-col items-start gap-2 text-ink-muted">
              <Badge tone="strong">{copy.founder.badge}</Badge>
              {copy.founder.priceLock(formatPremiumPrice("month"))}
            </p>
          ) : null}

          <PlanChoice
            config={config}
            email={user.email}
            userId={user.id}
            subscribed={subscribed}
            initialInterval={subscribed ? intervalOfPrice(subscription?.priceId ?? null) : "month"}
          />

          {subscribed ? (
            <ActiveSubscription
              status={subscription?.status ?? null}
              periodEnd={subscription?.currentPeriodEnd ?? null}
              cancelAt={subscription?.cancelAt ?? null}
              portalFailed={portail === "erreur"}
            />
          ) : null}

          <p className="text-sm text-ink-faint">{copy.paymentBy}</p>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-sm text-ink-muted">
              <th scope="col" className="py-2 pr-4 font-semibold">
                {copy.compare.feature}
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">
                {copy.compare.free}
              </th>
              <th scope="col" className="py-2 text-right font-semibold text-ink">
                {copy.compare.premium}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line">
                <th scope="row" className="py-3 pr-4 font-normal text-ink">
                  {row.label}
                </th>
                <td className="py-3 pr-4 text-right text-ink-muted tabular">{row.free}</td>
                <td className="py-3 text-right font-semibold text-ink tabular">{row.paid}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="py-3 pr-4 font-normal text-ink">
                {copy.compare.everything}
              </th>
              <td className="py-3 pr-4 text-right text-ink-muted">
                <Check aria-label={copy.compare.included} className="ml-auto size-4" />
              </td>
              <td className="py-3 text-right text-ink">
                <Check aria-label={copy.compare.included} className="ml-auto size-4" />
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </PageShell>
  );
}

function ActiveSubscription({
  status,
  periodEnd,
  cancelAt,
  portalFailed,
}: {
  status: string | null;
  periodEnd: Date | null;
  cancelAt: Date | null;
  portalFailed: boolean;
}) {
  const note =
    status === "past_due"
      ? copy.active.pastDue
      : cancelAt
        ? copy.active.ends(formatLongDate(cancelAt))
        : periodEnd
          ? copy.active.renews(formatLongDate(periodEnd))
          : null;
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-lg font-semibold text-ink">{copy.active.title}</p>
      {note ? <p className="text-ink-muted">{note}</p> : null}
      {status ? (
        <form action={openBillingPortal} className="flex flex-col items-start gap-2">
          <SubmitButton variant="secondary">{copy.active.manage}</SubmitButton>
          <span className="text-sm text-ink-faint">{copy.active.manageHint}</span>
        </form>
      ) : null}
      {portalFailed ? <ErrorNotice>{copy.active.manageError}</ErrorNotice> : null}
    </div>
  );
}
