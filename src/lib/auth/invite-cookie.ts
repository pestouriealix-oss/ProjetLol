/**
 * Le code d'invitation garde le temps d'un aller-retour chez Discord : la page
 * d'inscription le dépose, la connexion Discord le lit (voir `signIn`).
 */
export const INVITE_COOKIE = "gufo-invite";
/** Assez pour autoriser Discord, pas plus. */
export const INVITE_COOKIE_SECONDS = 15 * 60;
