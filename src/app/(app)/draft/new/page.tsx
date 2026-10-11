import { ImageUp } from "lucide-react";
import type { Metadata } from "next";

import { Slash } from "@/components/brand/slash";
import { DraftBoard } from "@/components/draft/draft-board";
import { PageShell } from "@/components/layout/page-shell";
import { MiniMap } from "@/components/map/mini-map";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { listRiotAccounts } from "@/lib/db/riot-accounts";

export const metadata: Metadata = { title: t.draft.title };

const copy = t.draft;

export default async function NewDraftPage() {
  const user = await requireUser();
  const accounts = await listRiotAccounts(user.id);
  // Le joueur est placé à son rôle principal, dans le tableau comme sur la carte.
  const mainRole = accounts.find((account) => account.isPrimary)?.roles[0];

  return (
    <PageShell route="draft-new" title={copy.title} aside={<Badge tone="warn">{copy.soon}</Badge>}>
      {/* À gauche ce qu'on donne (la capture, les dix champions), à droite ce
          qu'on reçoit (la fiche). */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 rounded-panel border border-dashed border-line-strong px-5 py-5">
            <ImageUp aria-hidden className="size-7 shrink-0 text-ink-faint" />
            <div>
              <h2 className="text-lg font-semibold text-ink">{copy.capture.title}</h2>
              <p className="pt-0.5 text-ink-muted">{copy.capture.body}</p>
            </div>
          </div>
          <DraftBoard me={mainRole} />
        </div>

        <Panel className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="display text-2xl text-ink">{copy.sheet.title}</h2>
            <p className="pt-1 text-ink-muted">{copy.sheet.body}</p>
          </div>
          <MiniMap showTeams me={mainRole} introDelay={200} />
          <ul className="flex flex-col gap-2">
            {copy.sheet.items.map((item) => (
              <li key={item} className="flex gap-2.5 text-ink-muted">
                <Slash className="mt-[0.3em] h-[0.8em] text-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
