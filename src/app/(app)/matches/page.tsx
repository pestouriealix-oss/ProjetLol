import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { MatchListEmpty } from "@/components/matches/match-list-empty";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { countRiotAccounts } from "@/lib/db/riot-accounts";

export const metadata: Metadata = { title: t.matches.title };

const copy = t.matches;

export default async function MatchesPage() {
  const user = await requireUser();
  const linkedAccounts = await countRiotAccounts(user.id);

  return (
    <PageShell route="matches" title={copy.title}>
      {linkedAccounts === 0 ? (
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
      ) : (
        <MatchListEmpty rows={6} title={copy.emptyTitle} body={copy.emptyBody} />
      )}
    </PageShell>
  );
}
