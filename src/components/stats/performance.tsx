import { ChampionIcon } from "@/components/champion/champion-icon";
import { RoleGlyph } from "@/components/map/role-glyph";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import type { ChampionAssets } from "@/lib/ddragon/champions";
import type { PerformanceTotals } from "@/lib/db/matches";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { kdaRatio } from "@/lib/stats/participation";
import type { Role } from "@/lib/config";

const copy = t.stats;

/** Moyennes par partie et par minute, à partir des totaux. */
export function averages(row: PerformanceTotals) {
  const games = Math.max(1, row.games);
  const minutes = Math.max(1, row.seconds / 60);
  return {
    winrate: row.wins / games,
    kills: row.kills / games,
    deaths: row.deaths / games,
    assists: row.assists / games,
    kda: kdaRatio(row.kills, row.deaths, row.assists),
    csPerMinute: row.cs / minutes,
    damagePerMinute: row.damage / minutes,
    vision: row.vision / games,
    killParticipation: row.killParticipation,
  };
}

/** Taux de victoire : le chiffre, et une barre fine. Jamais la couleur seule. */
function Winrate({ ratio }: { ratio: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-10 text-right tabular">{formatPercent(ratio)}</span>
      <span aria-hidden className="h-1.5 w-12 overflow-hidden rounded-pill bg-field max-sm:hidden">
        <span
          className={cn("block h-full rounded-pill", ratio >= 0.5 ? "bg-win" : "bg-loss")}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>
    </span>
  );
}

export function RoleStats({ rows }: { rows: (PerformanceTotals & { role: Role | null })[] }) {
  return (
    <section aria-labelledby="roles-title" className="flex flex-col gap-3">
      <h2 id="roles-title" className="display text-2xl text-ink">
        {copy.roles.title}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const stats = averages(row);
          return (
            <li key={row.role ?? "aucun"}>
              <Panel className="flex items-center gap-3 p-4">
                {row.role ? (
                  <RoleGlyph role={row.role} className="size-6 text-ink-muted" />
                ) : (
                  <span aria-hidden className="size-6" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {row.role ? t.roles[row.role] : copy.roles.unknown}
                  </p>
                  <p className="text-sm text-ink-muted tabular">
                    {copy.games(row.games)} · {t.matches.kda(formatDecimal(stats.kda))}
                  </p>
                </div>
                <Winrate ratio={stats.winrate} />
              </Panel>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ChampionStatsTable({
  rows,
  champions,
}: {
  rows: (PerformanceTotals & { championName: string })[];
  champions: ChampionAssets | null;
}) {
  const c = copy.champions;
  return (
    <section aria-labelledby="champions-title" className="flex flex-col gap-3">
      <h2 id="champions-title" className="display text-2xl text-ink">
        {c.title}
      </h2>
      <div className="overflow-x-auto rounded-panel border border-line bg-surface">
        <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-faint">
              <th scope="col" className="py-2.5 pl-4 font-semibold">
                {c.champion}
              </th>
              <th scope="col" className="py-2.5 pr-3 text-right font-semibold">
                {c.games}
              </th>
              <th scope="col" className="py-2.5 pr-3 text-right font-semibold">
                {c.winrate}
              </th>
              <th scope="col" className="py-2.5 pr-3 text-right font-semibold">
                {c.kda}
              </th>
              <th scope="col" className="py-2.5 pr-3 text-right font-semibold max-md:hidden">
                {c.csPerMinute}
              </th>
              <th scope="col" className="py-2.5 pr-3 text-right font-semibold max-md:hidden">
                {c.damagePerMinute}
              </th>
              <th scope="col" className="py-2.5 pr-3 text-right font-semibold max-lg:hidden">
                {c.vision}
              </th>
              <th scope="col" className="py-2.5 pr-4 text-right font-semibold max-lg:hidden">
                {c.killParticipation}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const stats = averages(row);
              const name = champions?.name(row.championName) ?? row.championName;
              return (
                <tr key={row.championName} className="border-b border-line last:border-b-0">
                  <td className="py-2 pl-4">
                    <span className="flex items-center gap-2.5 font-semibold text-ink">
                      <ChampionIcon
                        name={name}
                        src={champions?.iconUrl(row.championName) ?? null}
                        className="size-8"
                      />
                      {name}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-ink tabular">{row.games}</td>
                  <td className="py-2 pr-3 text-right text-ink">
                    <Winrate ratio={stats.winrate} />
                  </td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap tabular">
                    <span className="text-ink">{formatDecimal(stats.kda)}</span>
                    <span className="block text-xs text-ink-faint">
                      {c.averageScore(
                        formatDecimal(stats.kills),
                        formatDecimal(stats.deaths),
                        formatDecimal(stats.assists),
                      )}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-ink tabular max-md:hidden">
                    {formatDecimal(stats.csPerMinute)}
                  </td>
                  <td className="py-2 pr-3 text-right text-ink tabular max-md:hidden">
                    {formatInteger(Math.round(stats.damagePerMinute))}
                  </td>
                  <td className="py-2 pr-3 text-right text-ink tabular max-lg:hidden">
                    {formatDecimal(stats.vision)}
                  </td>
                  <td className="py-2 pr-4 text-right text-ink tabular max-lg:hidden">
                    {formatPercent(stats.killParticipation)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Minimum de parties contre un champion pour qu'un bilan veuille dire quelque chose. */
const MIN_MATCHUP_GAMES = 2;

export function Matchups({
  rows,
  champions,
}: {
  rows: { opponent: string; games: number; wins: number }[];
  champions: ChampionAssets | null;
}) {
  const m = copy.matchups;
  const eligible = rows.filter((row) => row.games >= MIN_MATCHUP_GAMES);
  const rate = (row: { games: number; wins: number }) => row.wins / row.games;
  const worst = [...eligible]
    .sort((a, b) => rate(a) - rate(b) || b.games - a.games)
    .filter((row) => rate(row) < 0.5)
    .slice(0, 5);
  const best = [...eligible]
    .sort((a, b) => rate(b) - rate(a) || b.games - a.games)
    .filter((row) => rate(row) >= 0.5)
    .slice(0, 5);

  const list = (title: string, items: typeof eligible) => (
    <Panel className="p-4">
      <h3 className="font-semibold text-ink">{title}</h3>
      <ul className="mt-2 flex flex-col">
        {items.map((row) => {
          const name = champions?.name(row.opponent) ?? row.opponent;
          return (
            <li
              key={row.opponent}
              className="flex items-center gap-2.5 border-t border-line py-2 first:border-t-0"
            >
              <ChampionIcon
                name={name}
                src={champions?.iconUrl(row.opponent) ?? null}
                className="size-7"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{name}</span>
              <span className="text-xs text-ink-muted tabular">
                {m.record(row.wins, row.games)}
              </span>
              <Winrate ratio={rate(row)} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );

  return (
    <section aria-labelledby="matchups-title" className="flex flex-col gap-3">
      <div>
        <h2 id="matchups-title" className="display text-2xl text-ink">
          {m.title}
        </h2>
        <p className="text-sm text-ink-muted">{m.body}</p>
      </div>
      {worst.length + best.length === 0 ? (
        <p className="text-ink-muted">{m.empty}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {worst.length > 0 ? list(m.worst, worst) : null}
          {best.length > 0 ? list(m.best, best) : null}
        </div>
      )}
    </section>
  );
}
