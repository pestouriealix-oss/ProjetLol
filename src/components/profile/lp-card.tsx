import { LpChart } from "@/components/stats/lp-chart";
import { lpChartFloors, lpChartPoints } from "@/components/stats/lp-points";
import { FlapValue } from "@/components/ui/flap-value";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import type { RankSnapshot } from "@/lib/db/schema";
import { formatSignedInteger } from "@/lib/format";

const copy = t.dashboard.lp;

/**
 * Courbe des LP, en petit sous le classement : la file classée où le rang a
 * bougé (Solo/Duo d'abord), et un lien vers la page Stats pour le détail.
 * Riot ne donne pas d'historique : la courbe naît des mises à jour du compte.
 */
export function LpCard({
  solo,
  flex,
  statsHref,
}: {
  solo: RankSnapshot[];
  flex: RankSnapshot[];
  /** Page Stats du compte, sans la file (ajoutée ici). */
  statsHref: string;
}) {
  const soloPoints = lpChartPoints(solo);
  const flexPoints = lpChartPoints(flex);
  const useFlex = soloPoints.length < 2 && flexPoints.length >= 2;
  const points = useFlex ? flexPoints : soloPoints;
  const start = points[0];
  const end = points.at(-1);
  const change = start && end ? end.points - start.points : 0;

  return (
    <Panel className="flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="display text-xl text-ink">{copy.title}</h2>
        <span className="text-sm font-semibold text-ink-faint">
          {useFlex ? t.matches.queues.FLEX : t.matches.queues.SOLO}
        </span>
      </div>
      {points.length < 2 || !start ? (
        <p className="text-sm text-ink-muted">{copy.empty}</p>
      ) : (
        <>
          {/* Le gain de la période sur un panneau à volets : il tombe une fois, à l'arrivée. */}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <FlapValue
              value={`${formatSignedInteger(change)}`}
              label={t.stats.lp.changeLabel(formatSignedInteger(change), start.date)}
              delayMs={200}
              className={cn(
                "display text-3xl",
                change > 0 ? "text-win" : change < 0 ? "text-loss" : "text-ink-muted",
              )}
            />
            <span aria-hidden className="text-sm text-ink-muted">
              {copy.since(start.date)}
            </span>
          </p>
          <LpChart compact showChange={false} points={points} floors={lpChartFloors()} />
        </>
      )}
      <Link
        href={`${statsHref}&file=${useFlex ? "flex" : "solo"}`}
        className="tap w-fit text-sm font-semibold text-ink-muted underline-offset-4 transition-colors duration-(--duration-fast) hover:text-ink hover:underline"
      >
        {copy.details}
      </Link>
    </Panel>
  );
}
