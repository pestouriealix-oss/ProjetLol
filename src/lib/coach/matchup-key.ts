import type { Role } from "@/lib/config";

/**
 * Clé d'un duel déjà écrit : tout ce dont son texte dépend. Deux joueurs qui
 * ont la même clé reçoivent le même texte ; qu'un élément change (patch,
 * modèle, prompt, duo en bas, verdict des statistiques) et le duel est réécrit.
 */
export type MatchupKeyParts = {
  promptVersion: string;
  model: string;
  /** « 16.20 ». */
  patch: string;
  role: Role;
  /** Identifiants Data Dragon des deux champions du duel. */
  mine: string;
  theirs: string;
  /** En bas : le partenaire de chaque côté. */
  partners: { mine: string; theirs: string } | null;
  /** Verdict dicté par des statistiques fiables, sinon `null`. */
  statsVerdict: "favorable" | "even" | "unfavorable" | null;
};

export function matchupNoteKey(parts: MatchupKeyParts): string {
  return [
    parts.promptVersion,
    parts.model,
    parts.patch,
    parts.role,
    parts.mine,
    parts.theirs,
    parts.partners ? `${parts.partners.mine}+${parts.partners.theirs}` : "-",
    parts.statsVerdict ?? "sans-stats",
  ].join("|");
}

/** Le poste du partenaire de voie : le support pour le tireur, et inversement. */
export function lanePartnerRole(role: Role): Role | null {
  if (role === "ADC") return "SUPPORT";
  if (role === "SUPPORT") return "ADC";
  return null;
}
