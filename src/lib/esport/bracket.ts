import type { BracketMatch } from "./schemas";

/**
 * Mise en page d'un arbre à partir des liens de PandaScore : chaque match
 * indique de quels matchs viennent ses deux équipes (`previous_matches`), et
 * s'il en reçoit le vainqueur ou le perdant.
 *
 * - Un match est dans le tableau des perdants s'il reçoit un perdant, ou s'il
 *   suit un match de ce tableau.
 * - La grande finale reçoit un vainqueur de chaque tableau.
 * - La colonne d'un match est sa profondeur dans son tableau : 0 pour un
 *   premier tour, puis 1 + la colonne du plus avancé des matchs qui le
 *   précèdent dans le même tableau.
 */

export type BracketSectionKind = "single" | "upper" | "lower" | "final";

export type BracketSection = {
  kind: BracketSectionKind;
  /** Colonnes de gauche à droite ; dans chaque colonne, les matchs de haut en bas. */
  columns: BracketMatch[][];
};

const when = (match: BracketMatch) => {
  const value = match.begin_at ?? match.scheduled_at;
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
};

export function layoutBracket(matches: BracketMatch[]): BracketSection[] {
  const byId = new Map(matches.map((match) => [match.id, match]));
  const previous = (match: BracketMatch) =>
    match.previous_matches.flatMap((link) => {
      const source = byId.get(link.match_id);
      return source ? [{ type: link.type, match: source }] : [];
    });
  const hasLower = matches.some((match) => previous(match).some((link) => link.type === "loser"));

  // Tableau de chaque match, déduit de ceux qui le précèdent (mémorisé ; une
  // boucle dans les données, qui ne devrait pas exister, est coupée).
  const kinds = new Map<number, BracketSectionKind>();
  const kindOf = (match: BracketMatch, seen: Set<number> = new Set()): BracketSectionKind => {
    const known = kinds.get(match.id);
    if (known) return known;
    if (!hasLower) return "single";
    if (seen.has(match.id)) return "upper";
    seen.add(match.id);
    const links = previous(match);
    let kind: BracketSectionKind = "upper";
    if (links.some((link) => link.type === "loser")) {
      kind = "lower";
    } else if (links.length > 0) {
      const lower = links.filter((link) => kindOf(link.match, seen) === "lower").length;
      if (lower === links.length) kind = "lower";
      else if (lower > 0) kind = "final";
    }
    kinds.set(match.id, kind);
    return kind;
  };
  for (const match of matches) kindOf(match);

  const depths = new Map<number, number>();
  const depthOf = (match: BracketMatch, seen: Set<number> = new Set()): number => {
    const known = depths.get(match.id);
    if (known !== undefined) return known;
    if (seen.has(match.id)) return 0;
    seen.add(match.id);
    const kind = kindOf(match);
    const sameSection = previous(match).filter((link) => kindOf(link.match) === kind);
    const depth =
      sameSection.length === 0
        ? 0
        : 1 + Math.max(...sameSection.map((link) => depthOf(link.match, seen)));
    depths.set(match.id, depth);
    return depth;
  };

  const order: BracketSectionKind[] = ["single", "upper", "lower", "final"];
  return order
    .map((kind) => {
      const columns: BracketMatch[][] = [];
      for (const match of matches) {
        if (kindOf(match) !== kind) continue;
        (columns[depthOf(match)] ??= []).push(match);
      }
      return {
        kind,
        columns: columns
          .filter((column) => column !== undefined)
          .map((column) => column.sort((a, b) => when(a) - when(b) || a.id - b.id)),
      };
    })
    .filter((section) => section.columns.length > 0);
}
