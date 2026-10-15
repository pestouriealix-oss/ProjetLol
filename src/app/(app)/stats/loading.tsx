import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.stats;

/** Squelette des statistiques : mêmes sections, mêmes espacements. */
export default function StatsLoading() {
  return (
    <PageShell route="stats" title={copy.title}>
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      <Skeleton className="h-11 w-80 max-w-full" />
      <section aria-hidden className="flex flex-col gap-3">
        <p className="display text-2xl text-ink">{copy.lp.title}</p>
        <Skeleton className="h-56 rounded-panel sm:h-64" />
      </section>
      <section aria-hidden className="flex flex-col gap-3">
        <p className="display text-2xl text-ink">{copy.roles.title}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[4.5rem] rounded-panel" />
          ))}
        </div>
      </section>
      <section aria-hidden className="flex flex-col gap-3">
        <p className="display text-2xl text-ink">{copy.champions.title}</p>
        <Skeleton className="h-72 rounded-panel" />
      </section>
    </PageShell>
  );
}
