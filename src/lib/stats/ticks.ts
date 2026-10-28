/**
 * Repères de minutes d'un graphique de partie : toutes les 5 minutes (10 au-delà
 * de 40), sans le dernier s'il tombe trop près de la durée écrite au bout de l'axe.
 */
export function minuteTicks(lastMinute: number): number[] {
  const step = lastMinute > 40 ? 10 : 5;
  const ticks: number[] = [];
  for (let minute = step; lastMinute - minute >= step * 0.75; minute += step) {
    ticks.push(minute);
  }
  return ticks;
}
