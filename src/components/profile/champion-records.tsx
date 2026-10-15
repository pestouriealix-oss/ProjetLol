import { ChampionIcon } from "@/components/champion/champion-icon";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import type { ChampionAssets } from "@/lib/ddragon/champions";
import type { ChampionRecord } from "@/lib/db/matches";
import { formatDecimal, formatPercent } from "@/lib/format";
import { kdaRatio } from "@/lib/stats/participation";

const copy = t.dashboard.champions;

/** Champions les plus joués sur les parties enregistrées, avec le bilan de chacun. */
export function ChampionRecords({
  records,
  champions,
  statsHref,
}: {
  records: ChampionRecord[];
  champions: ChampionAssets | null;
  /** Lien vers la page de statistiques complètes du compte. */
  statsHref?: string;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="display text-xl text-ink">{copy.title}</h2>
        {statsHref && records.length > 0 ? (
          <Link
            href={statsHref}
            className="shrink-0 text-sm font-semibold text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink"
          >
            {t.stats.seeAll}
          </Link>
        ) : null}
      </div>
      {records.length === 0 ? (
        <p className="pt-3 text-ink-muted">{copy.empty}</p>
      ) : (
        <ul className="flex flex-col pt-2">
          {records.map((record) => {
            const name = champions?.name(record.championName) ?? record.championName;
            return (
              <li
                key={record.championName}
                className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0 last:pb-0"
              >
                <ChampionIcon
                  name={name}
                  src={champions?.iconUrl(record.championName) ?? null}
                  className="size-9"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{name}</p>
                  <p className="text-sm text-ink-muted tabular">
                    {copy.games(record.games)} ·{" "}
                    {copy.kda(formatDecimal(kdaRatio(record.kills, record.deaths, record.assists)))}
                  </p>
                </div>
                <p className="display text-xl text-ink tabular">
                  {formatPercent(record.wins / record.games)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
