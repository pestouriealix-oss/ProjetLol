import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: t.draft.title };

export default async function NewDraftPage() {
  await requireUser();
  return (
    <PageShell title={t.draft.title}>
      <Panel>
        <EmptyState title={t.draft.emptyTitle} body={t.draft.emptyBody} />
      </Panel>
    </PageShell>
  );
}
