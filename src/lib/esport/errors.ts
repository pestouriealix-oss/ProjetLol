/** Pourquoi un appel à PandaScore a échoué, en termes utiles à l'application. */
export type EsportErrorKind =
  /** Aucune clé configurée. */
  | "missing_key"
  /** Clé refusée, ou donnée réservée à une offre payante. */
  | "invalid_key"
  /** Trop d'appels (1 000 par heure avec l'offre gratuite). */
  | "rate_limited"
  /** PandaScore ne répond pas, ou répond autre chose que prévu. */
  | "unavailable";

export class EsportApiError extends Error {
  constructor(
    readonly kind: EsportErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "EsportApiError";
  }
}
