import type { Role } from "@/lib/config";

/**
 * Clé d'un duel déjà écrit : tout ce dont son texte dépend. Deux joueurs qui
 * ont la même clé reçoivent le même texte ; qu'un élément change (champions
 * rééquilibrés, saison, modèle, prompt, duo en bas, verdict des statistiques)
 * et le duel est réécrit.
 *
 * Le patch n'en fait pas partie : la plupart des champions ne bougent pas d'un
 * patch à l'autre, et leur duel reste juste. C'est l'empreinte Data Dragon des
 * deux champions qui dit s'ils ont changé ; la saison, elle, renouvelle tout
 * (objets, carte).
 */
export type MatchupKeyParts = {
  promptVersion: string;
  model: string;
  /** « 16.20 » : seule la saison (« 16 ») compte dans la clé. */
  patch: string;
  /**
   * Empreintes Data Dragon des deux champions (`championFingerprint`) ; `null`
   * si la fiche d'un champion manque : le duel ne vaut alors que pour ce patch.
   */
  fingerprints: { mine: string; theirs: string } | null;
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
  const season = parts.patch.split(".")[0] ?? parts.patch;
  return [
    parts.promptVersion,
    parts.model,
    parts.fingerprints
      ? `saison ${season}:${parts.fingerprints.mine}+${parts.fingerprints.theirs}`
      : `patch ${parts.patch}`,
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
