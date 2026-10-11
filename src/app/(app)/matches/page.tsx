import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { MatchList } from "@/components/matches/match-list";
import { MatchListEmpty } from "@/components/matches/match-list-empty";
import { AccountSwitcher } from "@/components/profile/account-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { listPlayedMatches } from "@/lib/db/matches";

import { getSelectedAccount, type AccountSearchParams } from "../selected-account";

export const metadata: Metadata = { title: t.matches.title };

const copy = t.matches;

/** Nombre de parties affichées ; la pagination viendra avec les filtres. */
const PAGE_SIZE = 50;

export default async function MatchesPage({ searchParams }: { searchParams: AccountSearchParams }) {
  const user = await requireUser();
  const { accounts, account } = await getSelectedAccount(user.id, searchParams);

  if (!account) {
    return (
      <PageShell route="matches" title={copy.title}>
        <MatchListEmpty
          rows={6}
          title={copy.emptyTitle}
          body={copy.noAccountBody}
          action={
            <Button asChild>
              <Link href="/settings">{copy.noAccountAction}</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  const [matches, champions] = await Promise.all([
    listPlayedMatches(user.id, account.id, { limit: PAGE_SIZE }),
    getChampionAssets(),
  ]);

  return (
    <PageShell
      route="matches"
      title={copy.title}
      aside={
        <div className="flex flex-wrap items-center gap-4">
          {matches.length > 0 ? (
            <p className="text-sm text-ink-muted tabular">{copy.count(matches.length)}</p>
          ) : null}
          <AccountSwitcher basePath="/matches" accounts={accounts} currentId={account.id} />
        </div>
      }
    >
      {matches.length === 0 ? (
        <MatchListEmpty
          rows={6}
          title={copy.emptyTitle}
          body={copy.emptyBody}
          action={
            <Button asChild variant="secondary">
              <Link href={`/dashboard?compte=${account.id}`}>{copy.toDashboard}</Link>
            </Button>
          }
        />
      ) : (
        <MatchList matches={matches} champions={champions} />
      )}
    </PageShell>
  );
}
