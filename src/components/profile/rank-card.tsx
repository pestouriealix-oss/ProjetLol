import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import type { RankSnapshot } from "@/lib/db/schema";
import { formatPercent } from "@/lib/format";

const copy = t.dashboard.rank;

const QUEUES = [
  { id: "RANKED_SOLO_5x5", label: t.matches.queues.SOLO },
  { id: "RANKED_FLEX_SR", label: t.matches.queues.FLEX },
] as const;

/** Au-dessus de Diamant, il n'y a plus de division. */
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

/**
 * Classement officiel, tel que publié par Riot au dernier relevé. Aucune
 * estimation de niveau caché.
 */
export function RankCard({ ranks, synced }: { ranks: RankSnapshot[]; synced: boolean }) {
  return (
    <Panel className="p-5">
      <h2 className="display text-xl text-ink">{copy.title}</h2>
      <dl className="flex flex-col pt-3">
        {QUEUES.map((queue) => {
          const rank = ranks.find((candidate) => candidate.queue === queue.id);
          const games = rank ? rank.wins + rank.losses : 0;
          return (
            <div
              key={queue.id}
              className="flex items-baseline justify-between gap-4 border-t border-line py-3 first:border-t-0 last:pb-0"
            >
              <dt className="font-semibold text-ink-muted">{queue.label}</dt>
              {rank ? (
                <dd className="text-right">
                  <p className="display text-2xl text-ink">
                    {copy.tiers[rank.tier] ?? rank.tier}
                    {APEX_TIERS.has(rank.tier) ? "" : ` ${rank.division}`}
                  </p>
                  <p className="text-sm text-ink-muted tabular">
                    {copy.lp(rank.lp)} · {copy.record(rank.wins, rank.losses)}
                    {games > 0 ? ` · ${formatPercent(rank.wins / games)}` : ""}
                  </p>
                </dd>
              ) : (
                <dd className="text-sm text-ink-faint">{synced ? copy.unranked : copy.pending}</dd>
              )}
            </div>
          );
        })}
      </dl>
    </Panel>
  );
}
