import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.news;

/** Squelette des actus : même structure et mêmes espacements que la page. */
export default function NewsLoading() {
  return (
    <PageShell route="news" title={copy.title}>
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      <div aria-hidden className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <Skeleton className="h-[9.875rem] rounded-panel" />
          <div className="flex flex-col gap-3">
            <p className="display text-2xl text-ink">{copy.previous}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 15 }, (_, index) => (
                <Skeleton key={index} className="h-12 rounded-control" />
              ))}
            </div>
          </div>
        </div>
        <Panel className="p-5">
          <p className="display text-xl text-ink">{copy.official.title}</p>
          <ul className="flex flex-col pt-2">
            {copy.official.links.map((link) => (
              <li key={link.href} className="border-t border-line py-3 first:border-t-0">
                <span className="font-semibold text-ink-muted">{link.label}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
