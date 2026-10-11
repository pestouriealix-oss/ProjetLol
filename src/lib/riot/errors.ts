/** Pourquoi un appel à l'API Riot a échoué, en termes utiles à l'application. */
export type RiotErrorKind =
  /** Aucune clé configurée. */
  | "missing_key"
  /** Clé refusée ou expirée (une clé de développement dure 24 h). */
  | "invalid_key"
  /** Le joueur, le compte ou la partie n'existe pas. */
  | "not_found"
  /** Trop d'appels : il faut attendre. */
  | "rate_limited"
  /** Riot ne répond pas, ou répond autre chose que prévu. */
  | "unavailable";

export class RiotApiError extends Error {
  constructor(
    readonly kind: RiotErrorKind,
    message: string,
    /** Secondes à attendre avant de réessayer, si Riot l'indique. */
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}
