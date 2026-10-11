import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { MiniMap } from "@/components/map/mini-map";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { listRiotAccounts } from "@/lib/db/riot-accounts";

export const metadata: Metadata = { title: t.draft.title };

export default async function NewDraftPage() {
  const user = await requireUser();
  const accounts = await listRiotAccounts(user.id);
  // Sur la carte, le pion corail se place au rôle principal du joueur.
  const mainRole = accounts.find((account) => account.isPrimary)?.roles[0];

  return (
    <PageShell route="draft-new" title={t.draft.title}>
      <Panel>
        <EmptyState
          title={t.draft.emptyTitle}
          body={t.draft.emptyBody}
          illustration={<MiniMap showTeams me={mainRole} introDelay={250} />}
        />
      </Panel>
    </PageShell>
  );
}
