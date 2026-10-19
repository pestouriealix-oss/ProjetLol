import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { DraftBoard } from "@/components/draft/draft-board";
import { SheetView } from "@/components/draft/sheet-view";
import { PageShell } from "@/components/layout/page-shell";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { findDraftAnalysis } from "@/lib/db/draft-analyses";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { draftSchema } from "@/lib/draft/draft";
import { readSheetView } from "@/lib/draft/sheet-view";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: t.draft.saved.title };

const copy = t.draft;

export default async function SavedDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [analysis, champions] = await Promise.all([
    findDraftAnalysis(user.id, id),
    getChampionAssets(),
  ]);
  if (!analysis) notFound();
  const draft = draftSchema.safeParse({
    allies: analysis.allies,
    enemies: analysis.enemies,
    myRole: analysis.myRole,
  });
  if (!draft.success) notFound();

  const champion = (championId: string) => ({
    name: champions?.name(championId) ?? championId,
    iconUrl: champions?.iconUrl(championId) ?? null,
  });
  const mine = draft.data.allies[draft.data.myRole];
  const opponent = draft.data.enemies[draft.data.myRole];

  return (
    <PageShell
      route="draft-sheet"
      title={copy.saved.title}
      header={
        <header className="flex flex-col gap-4">
          <Link
            href="/draft/new"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {copy.saved.back}
          </Link>
          <div>
            <h1 className="display text-3xl text-ink sm:text-4xl">
              {mine ? champion(mine).name : copy.saved.title}
              {opponent ? (
                <span className="text-ink-faint"> · {champion(opponent).name}</span>
              ) : null}
            </h1>
            <p className="mt-1 text-ink-muted">
              {t.roles[draft.data.myRole]} · {copy.sheet.patch(analysis.patch)} ·{" "}
              <time dateTime={analysis.createdAt.toISOString()}>
                {copy.sheet.createdAt(formatRelative(analysis.createdAt))}
              </time>
            </p>
          </div>
        </header>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-2 max-lg:order-2">
          <DraftBoard draft={draft.data} champion={champion} />
          <p className="text-sm text-ink-faint">{copy.board.readOnlyHint}</p>
        </div>
        <Panel className="p-5">
          <SheetView
            sheet={readSheetView(analysis.content)}
            opponent={opponent ? champion(opponent) : null}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
