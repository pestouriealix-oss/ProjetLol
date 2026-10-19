import type { Metadata } from "next";
import { Suspense } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { LiveBanner } from "@/components/live/live-banner";
import { MatchList } from "@/components/matches/match-list";
import { MatchListEmpty } from "@/components/matches/match-list-empty";
import { ChampionRecords } from "@/components/profile/champion-records";
import { LpCard } from "@/components/profile/lp-card";
import { ProfileHeader, type ProfileAccount } from "@/components/profile/profile-header";
import { RankCard } from "@/components/profile/rank-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { listChampionRecords, listPlayedMatches } from "@/lib/db/matches";
import { listLatestRanks, listRankHistory } from "@/lib/db/ranks";
import { formatRelative } from "@/lib/format";

import { getSelectedAccount, type AccountSearchParams } from "../selected-account";

export const metadata: Metadata = { title: t.dashboard.title };

const copy = t.dashboard;

/** Parties affichées sur le tableau de bord ; l'historique complet est sur « Parties ». */
const RECENT_MATCHES = 8;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: AccountSearchParams;
}) {
  const user = await requireUser();
  const { accounts: rows, account: selected } = await getSelectedAccount(user.id, searchParams);

  // Les portraits viennent de Data Dragon : chargés seulement s'il y a un compte à montrer.
  const champions = selected ? await getChampionAssets() : null;
  const toProfile = (row: (typeof rows)[number]): ProfileAccount => ({
    id: row.id,
    gameName: row.gameName,
    tagLine: row.tagLine,
    platform: row.platform,
    roles: row.roles,
    verified: row.verifiedAt !== null,
    iconUrl:
      row.profileIconId !== null ? (champions?.profileIconUrl(row.profileIconId) ?? null) : null,
    level: row.summonerLevel,
  });
  const accounts = rows.map(toProfile);
  const account = selected ? toProfile(selected) : undefined;

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

  const [ranks, soloHistory, flexHistory, records, matches] = await Promise.all([
    listLatestRanks(user.id, account.id),
    listRankHistory(user.id, account.id, "RANKED_SOLO_5x5", { limit: 300 }),
    listRankHistory(user.id, account.id, "RANKED_FLEX_SR", { limit: 300 }),
    listChampionRecords(user.id, account.id, { limit: 5 }),
    listPlayedMatches(user.id, account.id, { limit: RECENT_MATCHES }),
  ]);
  const lastSyncedAt = selected?.lastSyncedAt ?? null;

  return (
    <PageShell
      route="dashboard"
      title={copy.title}
      header={
        <ProfileHeader
          account={account}
          accounts={accounts}
          lastSynced={lastSyncedAt ? copy.sync.last(formatRelative(lastSyncedAt)) : copy.sync.never}
        />
      }
    >
      {/* Si le joueur est en partie, un bandeau y mène ; le reste n'attend pas Riot. */}
      {selected ? (
        <Suspense fallback={null}>
          <LiveBanner accountId={selected.id} platform={selected.platform} puuid={selected.puuid} />
        </Suspense>
      ) : null}
      {/* Colonne étroite : l'état du compte. Colonne large : les parties.
          Sur téléphone, les parties passent en premier. */}
      <div className="grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 max-lg:order-2">
          <RankCard ranks={ranks} synced={lastSyncedAt !== null} />
          <LpCard solo={soloHistory} flex={flexHistory} statsHref={`/stats?compte=${account.id}`} />
          <ChampionRecords
            records={records}
            champions={champions}
            statsHref={`/stats?compte=${account.id}`}
          />
        </div>

        <section aria-labelledby="recent-title" className="flex min-w-0 flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="recent-title" className="display text-2xl text-ink">
              {copy.recent.title}
            </h2>
            <Link
              href={`/matches?compte=${account.id}`}
              className="text-sm font-semibold text-ink-muted underline-offset-4 transition-colors duration-(--duration-fast) hover:text-ink hover:underline"
            >
              {copy.recent.all}
            </Link>
          </div>
          {matches.length === 0 ? (
            <MatchListEmpty title={t.matches.emptyTitle} body={copy.recent.empty} />
          ) : (
            <MatchList matches={matches} champions={champions} />
          )}
        </section>
      </div>
    </PageShell>
  );
}
