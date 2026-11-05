import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import type { ChampionAssets } from "@/lib/ddragon/champions";
import { formatShortDate } from "@/lib/format";
import type { Goal, Trend } from "@/lib/stats/goals";

import { formatAverage, formatMetric } from "./format";
import { TrendChart } from "./trend-chart";

const copy = t.progression;

/**
 * Un indicateur sur les dernières parties : sa moyenne en grand, la
 * comparaison des cinq dernières parties avec les précédentes, et la courbe.
 */
export function TrendCard({
  trend,
  goal,
  champions,
}: {
  trend: Trend;
  /** L'objectif en cours, s'il porte sur cet indicateur : sa cible est tracée. */
  goal: Goal | null;
  champions: ChampionAssets | null;
}) {
  const { metric } = trend;
  const name = copy.metrics[metric];
  const average = formatAverage(metric, trend.average);
  const target =
    goal && goal.metric === metric
      ? { value: goal.target, label: formatMetric(metric, goal.target) }
      : null;

  return (
    <Panel className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-semibold text-ink">{name}</h3>
          <p className="flex shrink-0 items-baseline gap-2">
            <span className="text-xs text-ink-faint">{copy.trends.average}</span>
            <span className="display text-3xl leading-none text-ink tabular">{average}</span>
          </p>
        </div>
        {trend.recent ? (
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-ink-muted tabular">
            <span>{copy.trends.recent(formatAverage(metric, trend.recent.average))}</span>
            <span aria-hidden className="text-ink-faint">
              ·
            </span>
            <span>{copy.trends.earlier(formatAverage(metric, trend.recent.earlier))}</span>
            {trend.recent.better !== null ? (
              <span className={cn("font-semibold", trend.recent.better ? "text-win" : "text-loss")}>
                {trend.recent.better ? copy.trends.better : copy.trends.worse}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      <TrendChart
        label={copy.trends.label(name, trend.points.length, average)}
        average={trend.average}
        target={target}
        points={trend.points.map((point) => ({
          date: formatShortDate(point.startedAt),
          champion: champions?.name(point.championName) ?? point.championName,
          win: point.win,
          value: point.value,
          label: formatMetric(metric, point.value),
        }))}
      />
    </Panel>
  );
}
