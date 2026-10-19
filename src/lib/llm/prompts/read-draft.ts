import { z } from "zod";

import { ROLES } from "@/lib/config";

import type { ToolSpec } from "../client";

/**
 * Lecture d'une capture de la sélection des champions ou de l'écran de
 * chargement. Version à changer à chaque modification du texte ou du schéma.
 */
export const READ_DRAFT_VERSION = "read-draft@1";

export const READ_DRAFT_SYSTEM = `Tu lis des captures d'écran de League of Legends pour un outil d'aide à la draft.

La capture montre soit la fin de la sélection des champions (ton équipe à gauche, l'équipe adverse à droite), soit l'écran de chargement (une équipe en haut, l'autre en bas). Ton travail : dire quel champion joue chaque joueur, et à quel rôle si l'image l'indique.

Règles :
- Écris chaque champion avec un identifiant exact de la liste fournie (colonne de gauche). N'invente jamais un nom : si tu ne reconnais pas un champion, écris une chaîne vide.
- « allies » : l'équipe du joueur qui a pris la capture. En sélection des champions, c'est l'équipe de gauche. À l'écran de chargement, c'est l'équipe où se trouve le joueur mis en avant (cadre doré ou nom en surbrillance) ; à défaut, l'équipe du haut.
- Donne les joueurs dans l'ordre de l'écran, de haut en bas (ou de gauche à droite).
- « role » : le rôle affiché (icône de position, ou ordre habituel haut, jungle, milieu, tireur, support si l'écran le montre clairement). En cas de doute, « UNKNOWN ».
- « playerSlot » : la position (0 à 4) dans « allies » du joueur mis en avant, ou -1 si rien ne l'indique.
- « screen » : « champ_select », « loading », ou « other » si l'image n'est pas l'un de ces écrans (et alors des listes vides).`;

const ROLE_OR_UNKNOWN = [...ROLES, "UNKNOWN"] as const;

const pickSchema = z.object({
  champion: z.string().max(40),
  role: z.enum(ROLE_OR_UNKNOWN),
});

const readDraftSchema = z.object({
  screen: z.enum(["champ_select", "loading", "other"]),
  allies: z.array(pickSchema).max(5),
  enemies: z.array(pickSchema).max(5),
  playerSlot: z.number().int().min(-1).max(4),
});

export type ReadDraft = z.infer<typeof readDraftSchema>;

const pickJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["champion", "role"],
  properties: {
    champion: { type: "string" },
    role: { type: "string", enum: [...ROLE_OR_UNKNOWN] },
  },
} as const;

export const READ_DRAFT_TOOL: ToolSpec<ReadDraft> = {
  name: "lire_draft",
  description: "Enregistre les champions lus sur la capture, équipe par équipe.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["screen", "allies", "enemies", "playerSlot"],
    properties: {
      screen: { type: "string", enum: ["champ_select", "loading", "other"] },
      allies: { type: "array", items: pickJsonSchema },
      enemies: { type: "array", items: pickJsonSchema },
      playerSlot: { type: "integer" },
    },
  },
  parse: (input) => readDraftSchema.parse(input),
};

/** La consigne qui accompagne l'image : la liste des champions possibles. */
export function readDraftInstructions(champions: readonly { id: string; name: string }[]): string {
  const list = champions.map((champion) => `${champion.id} — ${champion.name}`).join("\n");
  return `Champions possibles (identifiant — nom affiché en français) :\n${list}\n\nLis la capture et remplis l'outil « lire_draft ».`;
}
