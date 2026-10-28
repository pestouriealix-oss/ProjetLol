/**
 * Sous ce nombre de parties, un pourcentage de victoires trompe plus qu'il
 * n'informe (2 victoires sur 2 ne font pas « 100 % ») : on montre alors le
 * bilan brut, victoires et défaites.
 */
export const MIN_WINRATE_GAMES = 5;

/** Vrai si l'échantillon est assez grand pour afficher un pourcentage. */
export function showsWinrate(games: number): boolean {
  return games >= MIN_WINRATE_GAMES;
}
