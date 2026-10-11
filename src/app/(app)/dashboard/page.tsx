import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { countRiotAccounts } from "@/lib/db/riot-accounts";

export const metadata: Metadata = { title: t.dashboard.title };

export default async function DashboardPage() {
  const user = await requireUser();
  const linkedAccounts = await countRiotAccounts(user.id);

  return (
    <PageShell title={t.dashboard.title}>
      <Panel>
        {linkedAccounts === 0 ? (
          <EmptyState
            title={t.dashboard.noAccountTitle}
            body={t.dashboard.noAccountBody}
            action={
              <Button asChild>
                <Link href="/settings">{t.dashboard.noAccountAction}</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState title={t.dashboard.noMatchesTitle} body={t.dashboard.noMatchesBody} />
        )}
      </Panel>
    </PageShell>
  );
}
