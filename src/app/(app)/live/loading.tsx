import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.live;

/** Squelette de la partie en cours : mêmes deux équipes, mêmes lignes. */
export default function LiveLoading() {
  return (
    <PageShell route="live" title={copy.title}>
      <span className="sr-only" role="status">
        {copy.loading}
      </span>
      <Skeleton className="-mt-4 h-7 w-72 max-w-full" />
      {[copy.ourTeam, copy.theirTeam].map((title) => (
        <section key={title} aria-hidden className="flex flex-col gap-3">
          <p className="display text-2xl text-ink">{title}</p>
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-[6.25rem] rounded-panel sm:h-[4.5rem]" />
            ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
