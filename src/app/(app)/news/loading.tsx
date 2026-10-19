import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.news;

/** Squelette des actus : même structure et mêmes espacements que la page (vue Articles). */
export default function NewsLoading() {
  return (
    <PageShell route="news" title={copy.title}>
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      <div aria-hidden className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsSkeleton labels={[copy.views.articles, copy.views.patches]} />
            <TabsSkeleton labels={[copy.languages.all, copy.languages.fr, copy.languages.en]} />
          </div>
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <li
                  key={index}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-panel border border-line bg-surface p-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:p-3.5"
                >
                  <Skeleton className="order-last aspect-[4/3] w-20 rounded-control sm:order-first sm:aspect-video sm:w-40" />
                  <div className="flex flex-col gap-2 pt-0.5">
                    <Skeleton className="h-3 w-32 rounded-pill" />
                    <Skeleton className="h-5 w-full rounded-pill sm:w-4/5" />
                    <Skeleton className="hidden h-4 w-3/5 rounded-pill sm:block" />
                  </div>
                </li>
              ))}
            </ul>
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

function TabsSkeleton({ labels }: { labels: string[] }) {
  return (
    <ul className="flex w-fit max-w-full gap-1 rounded-control bg-field p-1">
      {labels.map((label) => (
        <li
          key={label}
          className="flex h-9 items-center px-3.5 text-sm font-semibold whitespace-nowrap text-ink-faint"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
