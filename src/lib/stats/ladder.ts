/**
 * Position sur l'échelle classée, pour tracer l'évolution d'un classement
 * officiel : chaque division vaut 100 points, de Fer IV (0) à Diamant I ; au-delà
 * (Maître et plus), les LP s'ajoutent sans division. Ce n'est qu'une mise à plat
 * du rang publié par Riot, pas une estimation de niveau caché.
 */

export const TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
] as const;
const APEX = ["MASTER", "GRANDMASTER", "CHALLENGER"] as const;
const DIVISIONS = ["IV", "III", "II", "I"] as const;

/** Points au début de Maître : sept paliers de quatre divisions. */
export const APEX_FLOOR = TIERS.length * 400;

export function ladderPoints(tier: string, division: string, lp: number): number | null {
  const tierIndex = TIERS.indexOf(tier as (typeof TIERS)[number]);
  if (tierIndex !== -1) {
    const divisionIndex = DIVISIONS.indexOf(division as (typeof DIVISIONS)[number]);
    if (divisionIndex === -1) return null;
    return tierIndex * 400 + divisionIndex * 100 + lp;
  }
  if ((APEX as readonly string[]).includes(tier)) return APEX_FLOOR + lp;
  return null;
}

/** Début de chaque palier, pour les repères horizontaux du graphique. */
export function tierFloors(): { tier: string; points: number }[] {
  return [
    ...TIERS.map((tier, index) => ({ tier, points: index * 400 })),
    { tier: "MASTER", points: APEX_FLOOR },
  ];
}

export type RankPoint = {
  at: Date;
  tier: string;
  division: string;
  lp: number;
  points: number;
};

/**
 * Relevés ramenés aux changements : une synchronisation sans changement de rang
 * n'ajoute pas de point, sauf le dernier relevé, qui prolonge la courbe jusqu'au
 * dernier passage. Les relevés illisibles sont ignorés.
 */
export function rankHistory(
  snapshots: { takenAt: Date; tier: string; division: string; lp: number }[],
): RankPoint[] {
  const points: RankPoint[] = [];
  const sorted = [...snapshots].sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
  for (const [index, snapshot] of sorted.entries()) {
    const value = ladderPoints(snapshot.tier, snapshot.division, snapshot.lp);
    if (value === null) continue;
    const previous = points.at(-1);
    const isLast = index === sorted.length - 1;
    if (previous && previous.points === value && !isLast) continue;
    points.push({
      at: snapshot.takenAt,
      tier: snapshot.tier,
      division: snapshot.division,
      lp: snapshot.lp,
      points: value,
    });
  }
  return points;
}
