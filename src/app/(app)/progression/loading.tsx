import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.progression;

/** Squelette de la progression : mêmes sections, mêmes espacements. */
export default function ProgressionLoading() {
  return (
    <PageShell route="progression" title={copy.title}>
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      <Skeleton aria-hidden className="h-64 rounded-panel lg:h-52" />
      <section aria-hidden className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <p className="display text-2xl text-ink">{copy.trends.title}</p>
            <Skeleton className="mt-1 h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-11 w-64 max-w-full" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[13.5rem] rounded-panel" />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
