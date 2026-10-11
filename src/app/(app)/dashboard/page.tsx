import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { BASES } from "@/components/map/geometry";
import { MiniMap } from "@/components/map/mini-map";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { countRiotAccounts } from "@/lib/db/riot-accounts";

export const metadata: Metadata = { title: t.dashboard.title };

export default async function DashboardPage() {
  const user = await requireUser();
  const linkedAccounts = await countRiotAccounts(user.id);

  return (
    <PageShell route="dashboard" title={t.dashboard.title}>
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
            // Le signal part de notre base : c'est ici que tout commence.
            illustration={<MiniMap ping={BASES.ours} introDelay={250} />}
          />
        ) : (
          <EmptyState
            title={t.dashboard.noMatchesTitle}
            body={t.dashboard.noMatchesBody}
            illustration={<MiniMap />}
          />
        )}
      </Panel>
    </PageShell>
  );
}
