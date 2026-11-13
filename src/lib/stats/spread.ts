/**
 * Écarte des repères posés sur un même axe quand ils se chevauchent : deux
 * objectifs pris à quelques secondes d'intervalle (un nash puis une tour) se
 * retrouveraient sinon l'un sur l'autre.
 *
 * Les repères trop proches forment un groupe, serré au pas `gap` et centré sur
 * la moyenne de leurs positions : chacun bouge le moins possible, et l'ordre
 * est conservé. Un groupe qui dépasserait d'un bord est ramené dans `[min, max]`.
 *
 * @param positions positions d'origine, triées par ordre croissant
 * @returns les nouvelles positions, dans le même ordre
 */
export function spread(positions: number[], gap: number, min: number, max: number): number[] {
  const groups: { sum: number; count: number }[] = [];
  const span = (group: { count: number }) => (group.count - 1) * gap;
  const start = (group: { sum: number; count: number }) =>
    group.sum / group.count - span(group) / 2;

  for (const position of positions) {
    groups.push({ sum: position, count: 1 });
    // Un groupe qui grossit s'élargit : il peut alors toucher le précédent, et ainsi de suite.
    while (groups.length > 1) {
      const last = groups[groups.length - 1]!;
      const previous = groups[groups.length - 2]!;
      if (start(last) - (start(previous) + span(previous)) >= gap) break;
      previous.sum += last.sum;
      previous.count += last.count;
      groups.pop();
    }
  }

  return groups.flatMap((group) => {
    const first = Math.min(Math.max(start(group), min), Math.max(min, max - span(group)));
    return Array.from({ length: group.count }, (_, index) => first + index * gap);
  });
}
