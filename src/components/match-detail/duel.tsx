import { ChampionIcon } from "@/components/champion/champion-icon";
import { TeamMark } from "@/components/draft/team-mark";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import type { DetailPlayer } from "@/lib/stats/match-detail";

import type { AssetResolver } from "./team-table";

const copy = t.matchDetail.duel;

const METRICS = [
  { key: "damage", label: copy.damage, value: (p: DetailPlayer) => p.damage },
  { key: "gold", label: copy.gold, value: (p: DetailPlayer) => p.gold },
  { key: "cs", label: copy.cs, value: (p: DetailPlayer) => p.cs },
  { key: "vision", label: copy.vision, value: (p: DetailPlayer) => p.vision },
] as const;

/**
 * Le joueur face à son adversaire direct, sur quatre mesures. Chaque ligne est
 * une barre partagée : la part de chacun dans leur total à deux. Le plus haut
 * des deux est écrit en clair, l'autre en retrait : l'écart se lit sans couleur.
 */
export function Duel({
  me,
  opponent,
  assets,
}: {
  me: DetailPlayer;
  opponent: DetailPlayer | null;
  assets: AssetResolver;
}) {
  if (!opponent) {
    return (
      <Panel className="p-5">
        <h2 className="display text-2xl text-ink">{copy.title}</h2>
        <p className="mt-2 text-ink-muted">{copy.none}</p>
      </Panel>
    );
  }

  const mine = assets.champion(me.championName);
  const theirs = assets.champion(opponent.championName);
  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="display text-2xl text-ink">{copy.title}</h2>
      <p className="mt-1 text-ink-muted">{copy.body(theirs.name)}</p>

      <div className="mt-5 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2.5">
          <ChampionIcon name={mine.name} src={mine.iconUrl} className="size-9" />
          <TeamMark side="ours" />
          <span className="font-semibold text-ink">{t.matchDetail.you}</span>
        </span>
        <span className="flex items-center gap-2.5">
          <span className="font-semibold text-ink-muted">{theirs.name}</span>
          <TeamMark side="theirs" />
          <ChampionIcon name={theirs.name} src={theirs.iconUrl} className="size-9" />
        </span>
      </div>

      <dl className="mt-4 flex flex-col gap-3.5">
        {METRICS.map((metric) => {
          const a = metric.value(me);
          const b = metric.value(opponent);
          const share = a + b > 0 ? a / (a + b) : 0.5;
          return (
            <div key={metric.key}>
              <dt className="text-center text-xs font-semibold text-ink-faint">{metric.label}</dt>
              <dd className="mt-1 grid grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 tabular">
                <span
                  className={cn("text-sm", a >= b ? "font-semibold text-ink" : "text-ink-muted")}
                >
                  {formatInteger(a)}
                </span>
                <span aria-hidden className="flex h-2 gap-0.5 overflow-hidden rounded-pill">
                  <span className="rounded-l-pill bg-ink" style={{ width: `${share * 100}%` }} />
                  <span className="flex-1 rounded-r-pill bg-ink-faint/45" />
                </span>
                <span
                  className={cn(
                    "text-right text-sm",
                    b > a ? "font-semibold text-ink" : "text-ink-muted",
                  )}
                >
                  {formatInteger(b)}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </Panel>
  );
}
