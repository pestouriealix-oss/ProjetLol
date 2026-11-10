import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.player;

/** Squelette du profil : même en-tête, mêmes deux colonnes que la page remplie. */
export default function PlayerLoading() {
  return (
    <PageShell
      route="player"
      title={copy.title}
      header={
        <header aria-hidden className="flex flex-col gap-4 pt-4 pb-2 sm:pt-8 sm:pb-4">
          <div className="flex items-center gap-4 sm:gap-5">
            <Skeleton className="size-14 rounded-panel sm:size-18" />
            <div className="flex min-w-0 flex-col gap-3">
              <Skeleton className="h-9 w-64 max-w-full sm:h-14 sm:w-96" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
          <Skeleton className="h-4 w-52" />
        </header>
      }
    >
      <span className="sr-only" role="status">
        {copy.loading}
      </span>
      <div aria-hidden className="grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 max-lg:order-2">
          <Skeleton className="h-52 rounded-panel" />
          <Skeleton className="h-72 rounded-panel" />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="display text-2xl text-ink">{copy.recent.title}</p>
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-[4.25rem] rounded-panel" />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
