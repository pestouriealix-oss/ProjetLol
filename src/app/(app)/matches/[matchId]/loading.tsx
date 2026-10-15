import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.matchDetail;

/** Squelette du détail d'une partie : même en-tête, mêmes deux équipes, mêmes espacements. */
export default function MatchDetailLoading() {
  return (
    <PageShell
      route="match"
      title={copy.title}
      header={
        <header className="flex flex-col gap-5">
          <span className="text-sm font-semibold text-ink-muted">{copy.back}</span>
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-1.5 -skew-x-[14deg] rounded-[1px]" />
            <Skeleton className="size-16" />
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-4 w-72 max-w-[60vw]" />
            </div>
          </div>
        </header>
      }
    >
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      {[copy.ourTeam, copy.theirTeam].map((title) => (
        <section key={title} aria-hidden className="flex flex-col gap-3">
          <p className="display text-2xl text-ink">{title}</p>
          <div className="flex flex-col gap-1.5 lg:gap-0 lg:overflow-hidden lg:rounded-panel lg:border lg:border-line">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-[6.5rem] rounded-panel lg:h-[4.0625rem] lg:rounded-none"
              />
            ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
