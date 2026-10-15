import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.esport;

/** Squelette de l'onglet Esport : même en-tête, mêmes colonnes, mêmes espacements. */
export default function EsportLoading() {
  return (
    <PageShell route="esport" title={copy.title}>
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      <div aria-hidden className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-panel" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-5 w-64 max-w-[60vw]" />
            </div>
          </div>
          <Skeleton className="h-11 w-80 max-w-full" />
          <div className="flex gap-6 overflow-hidden">
            {[4, 2, 1].map((count, index) => (
              <div key={index} className="flex shrink-0 flex-col justify-around gap-4">
                {Array.from({ length: count }, (_, row) => (
                  <Skeleton key={row} className="h-[5.375rem] w-52" />
                ))}
              </div>
            ))}
          </div>
          <p className="display text-xl text-ink">{copy.schedule.title}</p>
          <Skeleton className="h-40 rounded-panel" />
        </div>
        <Panel className="p-5">
          <p className="display text-xl text-ink">{copy.others.title}</p>
          <div className="flex flex-col gap-3 pt-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-9" />
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
