export type LlmErrorKind =
  /** ANTHROPIC_API_KEY n'est pas définie. */
  | "missing_key"
  /** Clé refusée (révoquée, mal copiée, crédit épuisé). */
  | "invalid_key"
  /** Trop d'appels d'un coup. */
  | "rate_limited"
  /** Le service ne répond pas ou est surchargé. */
  | "unavailable"
  /** Le modèle a refusé de répondre. */
  | "refused"
  /** Réponse reçue, mais pas dans la forme attendue. */
  | "invalid_output";

export class LlmError extends Error {
  constructor(
    readonly kind: LlmErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "LlmError";
  }
}
