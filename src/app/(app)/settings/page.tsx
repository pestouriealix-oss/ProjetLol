import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import {
  RiotAccountsSection,
  type RiotAccountView,
  type RsoResult,
} from "@/components/settings/riot-accounts-section";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { ErrorNotice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/panel";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";
import { isPaidPlan, limitsFor } from "@/lib/auth/entitlements";
import { requireUser } from "@/lib/auth/session";
import { listRiotAccounts } from "@/lib/db/riot-accounts";
import { isRsoEnabled } from "@/lib/riot/rso";

import { signOutAction } from "../actions";

export const metadata: Metadata = { title: t.settings.title };

const copy = t.settings.account;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ riot?: string; suppression?: string }>;
}) {
  const user = await requireUser();
  const { riot, suppression } = await searchParams;
  const rsoResult = riot && riot in t.settings.riot.rso.results ? (riot as RsoResult) : null;
  const accounts = await listRiotAccounts(user.id);

  // Seuls les champs utiles à l'affichage partent vers le navigateur.
  const accountViews: RiotAccountView[] = accounts.map((account) => ({
    id: account.id,
    gameName: account.gameName,
    tagLine: account.tagLine,
    platform: account.platform,
    roles: account.roles,
    isPrimary: account.isPrimary,
    verified: account.verifiedAt !== null,
  }));

  return (
    <PageShell route="settings" title={t.settings.title}>
      {/* La section « Compte » est passée en enfant : la section des comptes
          Riot la fait glisser quand sa liste change de hauteur. */}
      <RiotAccountsSection
        accounts={accountViews}
        maxAccounts={limitsFor(user.plan).riotAccounts}
        rso={{ enabled: isRsoEnabled(), result: rsoResult }}
      >
        <section
          aria-labelledby="account-title"
          className="flex flex-col gap-6 border-t border-line pt-10"
        >
          <SectionHeading id="account-title" title={copy.title} />
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
            <dl className="flex flex-wrap gap-x-12 gap-y-5">
              <div>
                <dt className="text-sm text-ink-muted">{copy.email}</dt>
                <dd className="pt-1 text-lg break-all text-ink">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">{copy.plan}</dt>
                <dd className="flex items-center gap-3 pt-1.5">
                  <Badge tone={isPaidPlan(user.plan) ? "strong" : "neutral"}>
                    {t.plans[user.plan]}
                  </Badge>
                  <Link
                    href="/premium"
                    className="text-sm font-semibold text-ink-muted underline underline-offset-4 hover:text-ink"
                  >
                    {isPaidPlan(user.plan) ? copy.managePlan : copy.upgrade}
                  </Link>
                </dd>
              </div>
            </dl>
            <form action={signOutAction}>
              <SubmitButton variant="secondary">{copy.signOut}</SubmitButton>
            </form>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-panel border border-loss/25 px-5 py-5">
            <div className="max-w-[58ch]">
              <h3 className="text-lg font-semibold text-ink">{copy.dangerTitle}</h3>
              <p className="pt-1 text-ink-muted">{copy.dangerBody}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <DeleteAccountButton />
              {suppression === "abonnement" ? (
                <ErrorNotice>{copy.deleteBlocked}</ErrorNotice>
              ) : null}
            </div>
          </div>
        </section>
      </RiotAccountsSection>
    </PageShell>
  );
}
