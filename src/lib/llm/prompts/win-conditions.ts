import { z } from "zod";

import type { Role } from "@/lib/config";

import type { ToolSpec } from "../client";
import { ROLE_NAMES } from "./shared";

/**
 * Conditions de victoire des deux équipes : la partie de la fiche qui dépend
 * des dix champions, écrite pour chaque partie. Version à changer à chaque
 * modification du texte ou du schéma.
 */
export const WIN_CONDITIONS_VERSION = "win-conditions@1";

export const WIN_CONDITIONS_SYSTEM = `Tu es un coach de League of Legends. Un joueur vient de finir sa sélection des champions et lit ta fiche pendant l'écran de chargement : il a une minute. Tu lui écris en français, en le tutoyant.

Tu écris les conditions de victoire : comment son équipe gagne cette partie, et comment l'équipe adverse la gagne. Une ou deux phrases chacune, concrètes (phase de jeu, objectif, combat, joueur clé). Le duel contre son vis-à-vis est traité à part : n'en parle pas.

Règles :
- Court et concret. Pas d'introduction, pas de formule de politesse, pas de généralités valables pour toutes les parties.
- Aucun pourcentage ni statistique. Pas d'estimation de niveau caché (MMR).
- Appuie-toi sur ce qui est stable d'un patch à l'autre (rôle des champions, pics de puissance). Si tu n'es pas sûr d'un détail, ne l'écris pas.
- Écris les champions par leur nom français habituel.
- Typographie française : espace insécable avant « : », « ? », « ! » et « ; ».`;

const text = (max: number) => z.string().trim().min(1).max(max);

export const winConditionsSchema = z.object({ ours: text(400), theirs: text(400) });

export type WinConditions = z.infer<typeof winConditionsSchema>;

export const WIN_CONDITIONS_TOOL: ToolSpec<WinConditions> = {
  name: "ecrire_conditions",
  description: "Écrit les conditions de victoire des deux équipes.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["ours", "theirs"],
    properties: { ours: { type: "string" }, theirs: { type: "string" } },
  },
  parse: (input) => winConditionsSchema.parse(input),
};

export type WinConditionsRequest = {
  patch: string;
  myRole: Role;
  /** Noms affichés, par rôle ; `null` pour une case inconnue. */
  allies: Record<Role, string | null>;
  enemies: Record<Role, string | null>;
  /** Palier officiel du joueur (« Émeraude »), s'il est connu. */
  rank: string | null;
};

/** Le message envoyé au modèle : les deux équipes, en clair. */
export function winConditionsMessage(request: WinConditionsRequest): string {
  const roles = Object.keys(ROLE_NAMES) as Role[];
  const line = (role: Role, side: Record<Role, string | null>) =>
    `- ${ROLE_NAMES[role]} : ${side[role] ?? "inconnu"}`;
  return [
    `Patch ${request.patch}.`,
    `Le joueur joue ${request.allies[request.myRole] ?? "?"} au poste ${ROLE_NAMES[request.myRole]}.`,
    request.rank ? `Son classement : ${request.rank}.` : null,
    "",
    "Son équipe :",
    ...roles.map((role) => line(role, request.allies)),
    "",
    "Équipe adverse :",
    ...roles.map((role) => line(role, request.enemies)),
    "",
    "Écris les conditions de victoire avec l'outil « ecrire_conditions ».",
  ]
    .filter((part) => part !== null)
    .join("\n");
}
