import { z } from "zod";

import type { Role } from "@/lib/config";

import type { ToolSpec } from "../client";

/**
 * Fiche de draft : conditions de victoire des deux équipes et matchup contre
 * le vis-à-vis. Version à changer à chaque modification du texte ou du schéma
 * (elle est enregistrée avec chaque fiche).
 */
export const DRAFT_SHEET_VERSION = "draft-sheet@1";

export const DRAFT_SHEET_SYSTEM = `Tu es un coach de League of Legends. Un joueur vient de finir sa sélection des champions et lit ta fiche pendant l'écran de chargement : il a une minute. Tu lui écris en français, en le tutoyant.

Ce que tu écris :
1. Les conditions de victoire : comment son équipe gagne cette partie, et comment l'équipe adverse la gagne. Une ou deux phrases chacune, concrètes (phase de jeu, objectif, combat, joueur clé).
2. Le matchup contre son vis-à-vis (même rôle en face ; en jungle, le jungler adverse ; en bas, pense au duo) :
   - un verdict : favorable, équilibré ou défavorable pour lui ;
   - un résumé en une phrase : qui domine la voie et à quel moment ça bascule ;
   - les moments clés : niveaux et objets qui changent le rapport de force, des deux côtés ;
   - deux ou trois façons de jouer ce matchup, au choix du joueur. Chacune a un titre court et une phrase d'explication. Ce sont des options, pas des ordres : chacune doit être une vraie manière de gagner, adaptée à son style ;
   - une chose à surveiller : la compétence ou la situation qui fait perdre le duel.

Règles :
- Court et concret. Pas d'introduction, pas de formule de politesse, pas de généralités valables pour toutes les parties.
- N'invente pas de chiffres : pas de pourcentage de victoire, pas de statistiques, pas d'estimation de niveau caché (MMR).
- Appuie-toi sur les forces et faiblesses connues des champions. Si le patch a pu changer un détail, reste sur ce qui est stable (rôle du champion, pics de puissance, compétences).
- Écris les champions par leur nom français habituel.
- Typographie française : espace insécable avant « : », « ? », « ! » et « ; ».`;

const text = (max: number) => z.string().trim().min(1).max(max);

export const draftSheetSchema = z.object({
  winConditions: z.object({ ours: text(400), theirs: text(400) }),
  matchup: z.object({
    verdict: z.enum(["favorable", "even", "unfavorable"]),
    summary: text(300),
    keyMoments: text(400),
    options: z
      .array(z.object({ title: text(60), detail: text(300) }))
      .min(2)
      .max(3),
    watchOut: text(300),
  }),
});

export type DraftSheet = z.infer<typeof draftSheetSchema>;

const string = { type: "string" } as const;

export const DRAFT_SHEET_TOOL: ToolSpec<DraftSheet> = {
  name: "ecrire_fiche",
  description: "Écrit la fiche de draft affichée au joueur pendant l'écran de chargement.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["winConditions", "matchup"],
    properties: {
      winConditions: {
        type: "object",
        additionalProperties: false,
        required: ["ours", "theirs"],
        properties: { ours: string, theirs: string },
      },
      matchup: {
        type: "object",
        additionalProperties: false,
        required: ["verdict", "summary", "keyMoments", "options", "watchOut"],
        properties: {
          verdict: { type: "string", enum: ["favorable", "even", "unfavorable"] },
          summary: string,
          keyMoments: string,
          options: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "detail"],
              properties: { title: string, detail: string },
            },
          },
          watchOut: string,
        },
      },
    },
  },
  parse: (input) => draftSheetSchema.parse(input),
};

const ROLE_NAMES: Record<Role, string> = {
  TOP: "haut",
  JUNGLE: "jungle",
  MID: "milieu",
  ADC: "tireur",
  SUPPORT: "support",
};

export type SheetRequest = {
  patch: string;
  myRole: Role;
  /** Noms affichés, par rôle ; `null` pour une case inconnue. */
  allies: Record<Role, string | null>;
  enemies: Record<Role, string | null>;
  /** Palier officiel du joueur (« Émeraude »), s'il est connu. */
  rank: string | null;
};

/** Le message envoyé au modèle : la draft, en clair. */
export function draftSheetMessage(request: SheetRequest): string {
  const line = (role: Role, side: Record<Role, string | null>) =>
    `- ${ROLE_NAMES[role]} : ${side[role] ?? "inconnu"}`;
  const roles = Object.keys(ROLE_NAMES) as Role[];
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
    "Écris la fiche avec l'outil « ecrire_fiche ».",
  ]
    .filter((part) => part !== null)
    .join("\n");
}
