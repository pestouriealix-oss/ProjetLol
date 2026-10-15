import type { Standing } from "./schemas";

/**
 * Phase suisse : chaque équipe joue jusqu'à trois victoires (qualifiée) ou
 * trois défaites (éliminée), contre des équipes au même bilan. On regroupe
 * donc le classement par bilan, comme sur les sites de compétition.
 */

export type SwissGroup = {
  kind: "qualified" | "active" | "eliminated";
  wins: number;
  losses: number;
  standings: Standing[];
};

export function isSwissStage(tournamentName: string): boolean {
  return /swiss|suisse/i.test(tournamentName);
}

export function swissGroups(standings: Standing[], target = 3): SwissGroup[] {
  const groups = new Map<string, SwissGroup>();
  for (const standing of standings) {
    const wins = standing.wins ?? 0;
    const losses = standing.losses ?? 0;
    const kind = wins >= target ? "qualified" : losses >= target ? "eliminated" : "active";
    const key = `${kind}:${wins}-${losses}`;
    const group = groups.get(key) ?? { kind, wins, losses, standings: [] };
    group.standings.push(standing);
    groups.set(key, group);
  }
  const kindOrder = { qualified: 0, active: 1, eliminated: 2 } as const;
  return [...groups.values()]
    .map((group) => ({ ...group, standings: group.standings.sort((a, b) => a.rank - b.rank) }))
    .sort(
      (a, b) => kindOrder[a.kind] - kindOrder[b.kind] || b.wins - a.wins || a.losses - b.losses,
    );
}
