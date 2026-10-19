import type { LlmErrorKind } from "@/lib/llm/errors";

/** Ce qui peut empêcher le coach de répondre, tel que la page l'explique. */
export type CoachErrorKind =
  | LlmErrorKind
  /** La capture n'est ni une sélection des champions ni un écran de chargement. */
  | "not_a_draft"
  /** La liste des champions (Data Dragon) n'a pas pu être chargée. */
  | "champions_unavailable"
  /** Draft incomplète ou incohérente (champion inconnu, en double…). */
  | "invalid_draft"
  /** Limite quotidienne de fiches de l'offre atteinte. */
  | "quota";

export class CoachError extends Error {
  constructor(
    readonly kind: CoachErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "CoachError";
  }
}
