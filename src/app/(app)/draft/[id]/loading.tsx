import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.draft;

/** Squelette d'une fiche enregistrée : même en-tête, même fiche en large, même rappel de la draft. */
export default function SavedDraftLoading() {
  return (
    <PageShell
      route="draft-sheet"
      title={copy.saved.title}
      header={
        <header className="flex flex-col gap-4">
          <span className="text-sm font-semibold text-ink-muted">{copy.saved.back}</span>
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-9 w-64 max-w-[70vw]" />
            <Skeleton className="h-4 w-56 max-w-[60vw]" />
          </div>
        </header>
      }
    >
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      <div aria-hidden className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <Panel className="flex flex-col gap-4 p-5 sm:p-6">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-3.5 rounded-pill" />
          ))}
        </Panel>
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-[25rem] rounded-panel" />
        </div>
      </div>
    </PageShell>
  );
}
