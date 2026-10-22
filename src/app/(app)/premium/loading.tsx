import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.premium;

/** Squelette de Premium : même en-tête, même carte, mêmes espacements que la page. */
export default function PremiumLoading() {
  return (
    <PageShell route="premium" title={copy.title}>
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      <header aria-hidden className="flex max-w-[60ch] flex-col gap-3">
        <p className="display text-3xl text-ink sm:text-4xl">{copy.headline}</p>
        <p className="text-lg text-ink-muted">{copy.lede}</p>
      </header>
      <Panel
        aria-hidden
        className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
      >
        <div className="flex flex-col gap-5">
          <Skeleton className="h-16 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-12 w-44" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}
