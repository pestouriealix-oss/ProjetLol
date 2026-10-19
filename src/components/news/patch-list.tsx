import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import type { Patch } from "@/lib/ddragon/patch-list";

const copy = t.news;

const externalLink = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Le patch actuel en grand, puis les précédents en grille serrée. `null` : Riot n'a pas répondu. */
export function PatchList({ patches }: { patches: Patch[] | null }) {
  const [current, ...previous] = patches ?? [];

  if (patches === null) {
    return (
      <div>
        <h2 className="display text-2xl text-ink">{copy.errorTitle}</h2>
        <ErrorNotice className="mt-3">{copy.errorBody}</ErrorNotice>
      </div>
    );
  }
  if (current === undefined) {
    return <h2 className="display text-2xl text-ink">{copy.emptyTitle}</h2>;
  }

  return (
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
  );
}
