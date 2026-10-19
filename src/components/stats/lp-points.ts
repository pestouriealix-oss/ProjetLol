import { t } from "@/i18n/fr";
import type { RankSnapshot } from "@/lib/db/schema";
import { formatShortDate } from "@/lib/format";
import { rankHistory, tierFloors } from "@/lib/stats/ladder";

import type { ChartFloor, ChartPoint } from "./lp-chart";

const tiers = t.dashboard.rank.tiers;
/** Au-dessus de Diamant, il n'y a plus de division. */
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

/** « Émeraude III », « Maître ». */
export function rankLabel(tier: string, division: string): string {
  return `${tiers[tier] ?? tier}${APEX_TIERS.has(tier) ? "" : ` ${division}`}`;
}

/** Les relevés de rang d'une file, prêts pour la courbe (un point par changement). */
export function lpChartPoints(snapshots: RankSnapshot[]): ChartPoint[] {
  return rankHistory(snapshots).map((point) => ({
    date: formatShortDate(point.at),
    rank: rankLabel(point.tier, point.division),
    lp: point.lp,
    points: point.points,
    time: point.at.getTime(),
  }));
}

/** Les paliers (Fer, Bronze…) tracés en repère derrière la courbe. */
export function lpChartFloors(): ChartFloor[] {
  return tierFloors().map((floor) => ({
    label: tiers[floor.tier] ?? floor.tier,
    points: floor.points,
  }));
}
