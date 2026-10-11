import { ChampionIcon } from "@/components/champion/champion-icon";
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
}: {
  records: ChampionRecord[];
  champions: ChampionAssets | null;
}) {
  return (
    <Panel className="p-5">
      <h2 className="display text-xl text-ink">{copy.title}</h2>
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
