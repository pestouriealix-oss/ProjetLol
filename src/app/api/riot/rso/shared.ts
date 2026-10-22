/** Cookie du jeton anti-falsification de Riot Sign On (le temps de l'aller-retour chez Riot). */
export const RSO_STATE_COOKIE = "kairos_rso_state";

/** L'adresse de retour déclarée chez Riot : la même à l'aller et à l'échange du code. */
export function rsoRedirectUri(request: Request): string {
  return `${new URL(request.url).origin}/api/riot/rso/callback`;
}
