import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import type { Patch } from "@/lib/ddragon/patch-list";
import { listPatches } from "@/lib/ddragon/patches";

export const metadata: Metadata = { title: t.news.title };

const copy = t.news;

const externalLink = { target: "_blank", rel: "noopener noreferrer" } as const;

export default async function NewsPage() {
  await requireUser();

  // Riot peut ne pas répondre : la page s'affiche quand même, avec ses liens.
  let patches: Patch[] | null;
  try {
    patches = await listPatches();
  } catch (error) {
    console.error("Liste des patchs indisponible", error);
    patches = null;
  }
  const [current, ...previous] = patches ?? [];

  return (
    <PageShell route="news" title={copy.title}>
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-8">
          {patches === null ? (
            <div>
              <h2 className="display text-2xl text-ink">{copy.errorTitle}</h2>
              <ErrorNotice className="mt-3">{copy.errorBody}</ErrorNotice>
            </div>
          ) : current === undefined ? (
            <h2 className="display text-2xl text-ink">{copy.emptyTitle}</h2>
          ) : (
            <>
              <Panel className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 p-6">
                <div>
                  <Badge tone="accent">{copy.current}</Badge>
                  <h2 className="pt-3 display text-6xl text-ink tabular">{current.id}</h2>
                </div>
                <Button asChild size="lg">
                  <a href={current.notesUrl} {...externalLink} title={copy.opensRiot}>
                    {copy.readNotes}
                    <ArrowUpRight aria-hidden />
                  </a>
                </Button>
              </Panel>

              {previous.length > 0 ? (
                <section aria-labelledby="previous-title" className="flex flex-col gap-3">
                  <h2 id="previous-title" className="display text-2xl text-ink">
                    {copy.previous}
                  </h2>
                  {/* Une grille serrée : vingt patchs ne doivent pas faire vingt grandes cartes. */}
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                    {previous.map((patch) => (
                      <li key={patch.id}>
                        <a
                          href={patch.notesUrl}
                          {...externalLink}
                          aria-label={copy.notesFor(patch.id)}
                          title={copy.opensRiot}
                          className="group flex h-12 items-center justify-between gap-2 rounded-control border border-line bg-surface pr-2.5 pl-3.5 transition-colors duration-(--duration-fast) ease-(--ease-out) hover:border-line-strong hover:bg-raised"
                        >
                          <span className="display text-xl text-ink tabular">{patch.id}</span>
                          <ArrowUpRight
                            aria-hidden
                            className="size-4 shrink-0 text-ink-faint transition-[translate,color] duration-(--duration-base) ease-(--ease-spring) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>

        <Panel className="p-5">
          <h2 className="display text-xl text-ink">{copy.official.title}</h2>
          <ul className="flex flex-col pt-2">
            {copy.official.links.map((link) => (
              <li key={link.href} className="border-t border-line first:border-t-0">
                <a
                  href={link.href}
                  {...externalLink}
                  className="group flex items-center justify-between gap-3 py-3 font-semibold text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink"
                >
                  {link.label}
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 shrink-0 text-ink-faint transition-colors duration-(--duration-fast) group-hover:text-accent"
                  />
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
