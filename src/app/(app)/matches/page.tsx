import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { MiniMap } from "@/components/map/mini-map";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: t.matches.title };

export default async function MatchesPage() {
  await requireUser();
  return (
    <PageShell route="matches" title={t.matches.title}>
      <Panel>
        <EmptyState
          title={t.matches.emptyTitle}
          body={t.matches.emptyBody}
          illustration={<MiniMap />}
        />
      </Panel>
    </PageShell>
  );
}
