import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.player;

/** Squelette de la recherche : même titre, même formulaire. */
export default function PlayerSearchLoading() {
  return (
    <PageShell route="player-search" title={copy.searchTitle}>
      <span className="sr-only" role="status">
        {copy.loading}
      </span>
      <p className="-mt-4 max-w-2xl text-lg text-ink-muted">{copy.searchIntro}</p>
      <Skeleton aria-hidden className="h-[8.5rem] max-w-3xl rounded-panel sm:h-[7.25rem]" />
    </PageShell>
  );
}
