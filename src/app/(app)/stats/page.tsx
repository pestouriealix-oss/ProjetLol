import type { Metadata } from "next";
import { z } from "zod";

import { PageShell } from "@/components/layout/page-shell";
import { MatchListEmpty } from "@/components/matches/match-list-empty";
import { AccountSwitcher } from "@/components/profile/account-switcher";
import { LpChart } from "@/components/stats/lp-chart";
import { lpChartFloors, lpChartPoints } from "@/components/stats/lp-points";
import { ChampionStatsTable, Matchups, RoleStats } from "@/components/stats/performance";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { listChampionStats, listMatchups, listRoleStats, type QueueFilter } from "@/lib/db/matches";
import { listRankHistory } from "@/lib/db/ranks";

import { getSelectedAccount } from "../selected-account";

export const metadata: Metadata = { title: t.stats.title };

const copy = t.stats;

const QUEUE_PARAM = { tout: "ALL", solo: "SOLO", flex: "FLEX" } as const satisfies Record<
  string,
  QueueFilter
>;
const queueParam = z
  .enum(["tout", "solo", "flex"])
  .catch("solo")
  .optional()
  .transform((value) => value ?? "solo");

type StatsSearchParams = Promise<{ compte?: string | string[]; file?: string | string[] }>;

const RANK_QUEUES: Record<QueueFilter, string | null> = {
  ALL: null,
  SOLO: "RANKED_SOLO_5x5",
  FLEX: "RANKED_FLEX_SR",
};

export default async function StatsPage({ searchParams }: { searchParams: StatsSearchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const { accounts, account } = await getSelectedAccount(user.id, Promise.resolve(params));
  const fileKey = queueParam.parse(Array.isArray(params.file) ? params.file[0] : params.file);
  const queue = QUEUE_PARAM[fileKey];

  if (!account) {
    return (
      <PageShell route="stats" title={copy.title}>
        <MatchListEmpty
          rows={4}
          title={copy.emptyTitle}
          body={t.matches.noAccountBody}
          action={
            <Button asChild>
              <Link href="/settings">{t.matches.noAccountAction}</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  const rankQueue = RANK_QUEUES[queue];
  const [champions, roles, matchups, snapshots, assets] = await Promise.all([
    listChampionStats(user.id, account.id, queue),
    listRoleStats(user.id, account.id, queue),
    listMatchups(user.id, account.id, queue),
    rankQueue ? listRankHistory(user.id, account.id, rankQueue, { limit: 300 }) : [],
    getChampionAssets(),
  ]);

  const points = lpChartPoints(snapshots);
  const floors = lpChartFloors();

  const href = (file: string) => `/stats?compte=${account.id}&file=${file}`;

  return (
    <PageShell
      route="stats"
      title={copy.title}
      aside={<AccountSwitcher basePath="/stats" accounts={accounts} currentId={account.id} />}
    >
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>

      {/* La file choisie vit dans l'adresse : la page se partage, Retour fonctionne. */}
      <nav aria-label={copy.queue} className="w-fit">
        <ul className="flex gap-1 rounded-control bg-field p-1">
          {(Object.keys(QUEUE_PARAM) as (keyof typeof QUEUE_PARAM)[]).map((key) => {
            const current = key === fileKey;
            return (
              <li key={key}>
                <Link
                  href={href(key)}
                  scroll={false}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center rounded-[5px] px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-fast) ease-(--ease-out)",
                    current ? "bg-raised text-ink shadow-key" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {copy.queues[QUEUE_PARAM[key]]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="lp-title" className="flex flex-col gap-3">
        <div>
          <h2 id="lp-title" className="display text-2xl text-ink">
            {copy.lp.title}
          </h2>
          <p className="text-sm text-ink-muted">{copy.lp.body}</p>
        </div>
        {!rankQueue ? (
          <p className="text-ink-muted">{copy.lp.noRankQueue}</p>
        ) : points.length < 2 ? (
          <Panel className="p-5 text-ink-muted">{copy.lp.empty}</Panel>
        ) : (
          <>
            <LpChart points={points} floors={floors} />
            <details className="text-sm">
              <summary className="w-fit cursor-pointer font-semibold text-ink-muted hover:text-ink">
                {copy.lp.table}
              </summary>
              <table className="mt-2 w-full max-w-md border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-xs text-ink-faint">
                    <th scope="col" className="py-1.5 font-semibold">
                      {copy.lp.date}
                    </th>
                    <th scope="col" className="py-1.5 font-semibold">
                      {copy.lp.rank}
                    </th>
                    <th scope="col" className="py-1.5 text-right font-semibold">
                      LP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((point) => (
                    <tr key={point.time} className="border-b border-line/60">
                      <td className="py-1.5 text-ink-muted">{point.date}</td>
                      <td className="py-1.5 text-ink">{point.rank}</td>
                      <td className="py-1.5 text-right text-ink tabular">{point.lp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </section>

      {champions.length === 0 ? (
        <MatchListEmpty
          rows={4}
          title={copy.emptyTitle}
          body={copy.emptyBody}
          action={
            <Button asChild variant="secondary">
              <Link href={`/dashboard?compte=${account.id}`}>{t.matches.toDashboard}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <RoleStats rows={roles} />
          <ChampionStatsTable rows={champions} champions={assets} />
          <Matchups rows={matchups} champions={assets} />
        </>
      )}
    </PageShell>
  );
}
