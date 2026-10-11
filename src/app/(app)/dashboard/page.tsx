import type { Metadata } from "next";
import { z } from "zod";

import { PageShell } from "@/components/layout/page-shell";
import { MatchListEmpty } from "@/components/matches/match-list-empty";
import { ProfileHeader, type ProfileAccount } from "@/components/profile/profile-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { listRiotAccounts } from "@/lib/db/riot-accounts";

export const metadata: Metadata = { title: t.dashboard.title };

const copy = t.dashboard;

/** Compte demandé dans l'adresse ; toute valeur inattendue est ignorée. */
const accountParam = z.string().min(1).max(64).optional().catch(undefined);

type DashboardPageProps = { searchParams: Promise<{ compte?: string | string[] }> };

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();
  const [rows, params] = await Promise.all([listRiotAccounts(user.id), searchParams]);

  const accounts: ProfileAccount[] = rows.map((row) => ({
    id: row.id,
    gameName: row.gameName,
    tagLine: row.tagLine,
    platform: row.platform,
    roles: row.roles,
  }));

  // La liste est triée compte principal en tête : c'est lui par défaut.
  const requested = accountParam.parse(params.compte);
  const account = accounts.find((candidate) => candidate.id === requested) ?? accounts[0];

  if (!account) {
    return (
      <PageShell route="dashboard" title={copy.title}>
        <section aria-labelledby="start-title" className="flex flex-col gap-5">
          <h2 id="start-title" className="display text-2xl text-ink">
            {copy.start.title}
          </h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {copy.start.steps.map((step, index) => (
              <li key={step.title}>
                <Panel className="flex h-full flex-col items-start gap-2 p-5">
                  <span
                    aria-hidden
                    className={
                      index === 0
                        ? "display text-4xl text-accent tabular"
                        : "display text-4xl text-ink-faint tabular"
                    }
                  >
                    {index + 1}
                  </span>
                  <h3 className="display text-2xl text-ink">{step.title}</h3>
                  <p className="text-ink-muted">{step.body}</p>
                  {index === 0 ? (
                    <Button asChild className="mt-3">
                      <Link href="/settings">{copy.start.action}</Link>
                    </Button>
                  ) : null}
                </Panel>
              </li>
            ))}
          </ol>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell
      route="dashboard"
      title={copy.title}
      header={<ProfileHeader account={account} accounts={accounts} />}
    >
      {/* Colonne étroite : l'état du compte. Colonne large : les parties.
          Sur téléphone, les parties passent en premier. */}
      <div className="grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 max-lg:order-2">
          <Panel className="p-5">
            <h2 className="display text-xl text-ink">{copy.rank.title}</h2>
            <dl className="flex flex-col pt-3">
              {[copy.rank.solo, copy.rank.flex].map((queue) => (
                <div
                  key={queue}
                  className="flex items-baseline justify-between gap-4 border-t border-line py-3 first:border-t-0 last:pb-0"
                >
                  <dt className="font-semibold text-ink">{queue}</dt>
                  <dd className="text-sm text-ink-faint">{copy.rank.pending}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel className="p-5">
            <h2 className="display text-xl text-ink">{copy.champions.title}</h2>
            <p className="pt-3 text-ink-muted">{copy.champions.empty}</p>
          </Panel>
        </div>

        <section aria-labelledby="recent-title" className="flex min-w-0 flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="recent-title" className="display text-2xl text-ink">
              {copy.recent.title}
            </h2>
            <Link
              href="/matches"
              className="text-sm font-semibold text-ink-muted underline-offset-4 transition-colors duration-(--duration-fast) hover:text-ink hover:underline"
            >
              {copy.recent.all}
            </Link>
          </div>
          <MatchListEmpty title={t.matches.emptyTitle} body={t.matches.emptyBody} />
        </section>
      </div>
    </PageShell>
  );
}
