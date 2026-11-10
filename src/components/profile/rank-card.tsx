import type { CSSProperties } from "react";

import { RankEmblem, rankText, tierTextClass } from "@/components/rank/rank-badge";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { t } from "@/i18n/fr";
import type { RankSnapshot } from "@/lib/db/schema";
import { formatPercent } from "@/lib/format";
import { showsWinrate } from "@/lib/stats/sample";

const copy = t.dashboard.rank;

/** Un classement, d'un relevé enregistré ou lu à l'instant chez Riot. */
export type RankLine = Pick<RankSnapshot, "queue" | "tier" | "division" | "lp" | "wins" | "losses">;

const QUEUES = [
  { id: "RANKED_SOLO_5x5", label: t.matches.queues.SOLO },
  { id: "RANKED_FLEX_SR", label: t.matches.queues.FLEX },
] as const;

/** La teinte du palier (jeton `--color-tier-…`), pour le halo derrière l'emblème. */
const tierGlow = (tier: string) =>
  ({ "--tier": `var(--color-tier-${tier.toLowerCase()})` }) as CSSProperties;

/**
 * Classement officiel, tel que publié par Riot au dernier relevé. Aucune
 * estimation de niveau caché. La file Solo/Duo est mise en avant, emblème en
 * grand dans un halo de la couleur du palier ; la Flex suit, en une ligne.
 */
export function RankCard({ ranks, synced }: { ranks: RankLine[]; synced: boolean }) {
  const [main, second] = QUEUES.map((queue) => ({
    ...queue,
    rank: ranks.find((candidate) => candidate.queue === queue.id) ?? null,
  }));
  if (!main || !second) return null;
  const missing = synced ? copy.unranked : copy.pending;

  return (
    <Panel className="p-5">
      <h2 className="display text-xl text-ink">{copy.title}</h2>
      <div className="flex items-center gap-4 pt-4">
        <div className="relative grid size-20 shrink-0 place-items-center">
          {main.rank ? (
            <>
              <span
                aria-hidden
                style={tierGlow(main.rank.tier)}
                className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--tier)_42%,transparent),transparent)]"
              />
              <RankEmblem tier={main.rank.tier} className="relative h-16" />
            </>
          ) : (
            <span
              aria-hidden
              className="size-14 rounded-full border border-dashed border-line-strong"
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-muted">{main.label}</p>
          {main.rank ? (
            <>
              <p className={cn("display text-3xl", tierTextClass(main.rank.tier))}>
                {rankText(main.rank)}
              </p>
              <p className="text-sm text-ink-muted tabular">{details(main.rank)}</p>
            </>
          ) : (
            <p className="text-ink-faint">{missing}</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <p className="font-semibold text-ink-muted">{second.label}</p>
        {second.rank ? (
          <p className="text-right">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 display text-lg",
                tierTextClass(second.rank.tier),
              )}
            >
              <RankEmblem tier={second.rank.tier} className="h-5" />
              {rankText(second.rank)}
            </span>
            <span className="block text-xs text-ink-muted tabular">{details(second.rank)}</span>
          </p>
        ) : (
          <p className="text-sm text-ink-faint">{missing}</p>
        )}
      </div>
    </Panel>
  );
}

/** « 42 LP · 61 V 55 D · 53 % » : le pourcentage seulement sur assez de parties. */
function details(rank: RankLine): string {
  const games = rank.wins + rank.losses;
  return `${copy.lp(rank.lp)} · ${copy.record(rank.wins, rank.losses)}${
    showsWinrate(games) ? ` · ${formatPercent(rank.wins / games)}` : ""
  }`;
}
