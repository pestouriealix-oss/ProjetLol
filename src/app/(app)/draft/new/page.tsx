import type { Metadata } from "next";

import { Slash } from "@/components/brand/slash";
import { DraftWorkspace } from "@/components/draft/draft-workspace";
import { PageShell } from "@/components/layout/page-shell";
import { MiniMap } from "@/components/map/mini-map";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { remainingSheets } from "@/lib/coach/sheet";
import { listRiotAccounts } from "@/lib/db/riot-accounts";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { llm } from "@/lib/llm";

export const metadata: Metadata = { title: t.draft.title };

const copy = t.draft;

export default async function NewDraftPage() {
  const user = await requireUser();
  const [accounts, champions, quota] = await Promise.all([
    listRiotAccounts(user.id),
    getChampionAssets(),
    remainingSheets(user.id, user.plan),
  ]);
  // Le joueur est placé à son rôle principal, dans le tableau comme sur la carte.
  const mainRole = accounts.find((account) => account.isPrimary)?.roles[0] ?? "MID";

  return (
    <PageShell route="draft-new" title={copy.title}>
      {!llm.isConfigured ? (
        <Panel className="max-w-3xl p-5">
          <h2 className="display text-xl text-ink">{copy.noKey.title}</h2>
          <p className="mt-1 text-ink-muted">{copy.noKey.body}</p>
        </Panel>
      ) : null}
      {!champions ? <ErrorNotice>{copy.capture.errors.champions_unavailable}</ErrorNotice> : null}

      <DraftWorkspace
        champions={champions?.list() ?? []}
        initialRole={mainRole}
        quota={{ remaining: quota.remaining, limit: quota.limit }}
        coachReady={llm.isConfigured}
        placeholder={
          <>
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
          </>
        }
      />
    </PageShell>
  );
}
