import { t } from "@/i18n/fr";
import type { RankSnapshot } from "@/lib/db/schema";
import { formatShortDate } from "@/lib/format";
import { divisionFloors, rankHistory, tierFloors } from "@/lib/stats/ladder";

import { rankText } from "@/components/rank/rank-badge";

import type { ChartFloor, ChartPoint } from "./lp-chart";

const tiers = t.dashboard.rank.tiers;

/** Les relevés de rang d'une file, prêts pour la courbe (un point par changement). */
export function lpChartPoints(snapshots: RankSnapshot[]): ChartPoint[] {
  return rankHistory(snapshots).map((point) => ({
    date: formatShortDate(point.at),
    rank: rankText({ tier: point.tier, division: point.division }),
    lp: point.lp,
    points: point.points,
    time: point.at.getTime(),
  }));
}

/** Les paliers (Fer, Bronze…) et leurs divisions, tracés en repère derrière la courbe. */
export function lpChartFloors(): ChartFloor[] {
  return [
    ...tierFloors().map((floor) => ({
      kind: "tier" as const,
      label: tiers[floor.tier] ?? floor.tier,
      points: floor.points,
    })),
    ...divisionFloors().map((floor) => ({
      kind: "division" as const,
      label: rankText({ tier: floor.tier, division: floor.division }),
      points: floor.points,
    })),
  ];
}
