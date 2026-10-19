import { z } from "zod";

import type { Role } from "@/lib/config";
import { formatInteger, formatPercent } from "@/lib/format";

import type { ToolSpec } from "../client";

/**
 * Fiche de draft : conditions de victoire des deux équipes et matchup contre
 * le vis-à-vis. Version à changer à chaque modification du texte ou du schéma
 * (elle est enregistrée avec chaque fiche).
 */
export const DRAFT_SHEET_VERSION = "draft-sheet@2";

export const DRAFT_SHEET_SYSTEM = `Tu es un coach de League of Legends. Un joueur vient de finir sa sélection des champions et lit ta fiche pendant l'écran de chargement : il a une minute. Tu lui écris en français, en le tutoyant.

Ce que tu écris :
1. Les conditions de victoire : comment son équipe gagne cette partie, et comment l'équipe adverse la gagne. Une ou deux phrases chacune, concrètes (phase de jeu, objectif, combat, joueur clé).
2. Le matchup contre son vis-à-vis (même rôle en face ; en jungle, le jungler adverse ; en bas, pense au duo) :
   - un verdict : favorable, équilibré ou défavorable pour lui ;
   - un résumé en une phrase : qui domine la voie et à quel moment ça bascule ;
   - les moments clés : niveaux et objets qui changent le rapport de force, des deux côtés ;
   - deux ou trois façons de jouer ce matchup, au choix du joueur. Chacune a un titre court et une phrase d'explication. Ce sont des options, pas des ordres : chacune doit être une vraie manière de gagner, adaptée à son style ;
   - une chose à surveiller : la compétence ou la situation qui fait perdre le duel.

Tu reçois des données vérifiées, à respecter :
- La fiche technique des deux champions du duel pour le patch en cours (Data Dragon) : passif, compétences, délais de récupération par rang. Ce que tu dis de leurs compétences et de leurs délais doit s'accorder avec elle ; ne cite pas de compétence absente de la fiche.
- Quand elles existent, les statistiques de parties classées Émeraude et plus : le taux de victoire du duel et le nombre de parties. Le taux du duel est affiché à côté de ta fiche : ne l'écris pas. S'il est marqué fiable, accorde ton verdict avec lui (52 % ou plus, favorable ; 48 % ou moins, défavorable ; entre les deux, équilibré) et explique d'où vient l'écart. S'il est absent ou peu fiable, fonde le verdict sur les compétences.

Règles :
- Court et concret. Pas d'introduction, pas de formule de politesse, pas de généralités valables pour toutes les parties.
- Aucun pourcentage ni statistique dans ton texte : les seuls chiffres permis sont les délais et les niveaux de la fiche technique. Pas d'estimation de niveau caché (MMR).
- Pour le reste (style de jeu, pics de puissance), appuie-toi sur ce qui est stable d'un patch à l'autre. Si tu n'es pas sûr d'un détail, ne l'écris pas.
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

/** Fiche technique d'un champion, telle que Data Dragon la donne. */
export type ChampionSheet = {
  name: string;
  passive: { name: string; text: string };
  spells: { key: string; name: string; cooldown: string; text: string }[];
};

/** Résultats de parties classées (compteurs bruts). */
export type GameRecord = { games: number; wins: number };

export type SheetRequest = {
  patch: string;
  ddragonVersion: string;
  myRole: Role;
  /** Noms affichés, par rôle ; `null` pour une case inconnue. */
  allies: Record<Role, string | null>;
  enemies: Record<Role, string | null>;
  /** Palier officiel du joueur (« Émeraude »), s'il est connu. */
  rank: string | null;
  /** Fiches techniques du champion du joueur et de son vis-à-vis. */
  champions: { mine: ChampionSheet | null; theirs: ChampionSheet | null };
  /** Statistiques Émeraude+ ; `null` si aucune n'a encore été collectée. */
  stats: {
    patch: string;
    matches: number;
    duel: GameRecord | null;
    reliable: boolean;
    mineAtRole: GameRecord | null;
    theirsAtRole: GameRecord | null;
  } | null;
};

const percent = (record: GameRecord) =>
  formatPercent(record.games > 0 ? record.wins / record.games : 0);

function championBlock(sheet: ChampionSheet | null, fallback: string): string[] {
  if (!sheet) return [`${fallback} : fiche technique indisponible.`];
  return [
    `${sheet.name} :`,
    `- Passif, ${sheet.passive.name} : ${sheet.passive.text}`,
    ...sheet.spells.map(
      (spell) =>
        `- ${spell.key}, ${spell.name}${spell.cooldown ? ` (délai ${spell.cooldown} s)` : ""} : ${spell.text}`,
    ),
  ];
}

function statsBlock(request: SheetRequest): string[] {
  const { stats } = request;
  const mine = request.allies[request.myRole] ?? "?";
  const theirs = request.enemies[request.myRole] ?? "?";
  if (!stats)
    return ["Aucune statistique de parties classées disponible : ne donne aucun pourcentage."];
  const lines = [
    `Statistiques Émeraude et plus, patch ${stats.patch} (${formatInteger(stats.matches)} parties classées analysées) :`,
  ];
  if (stats.duel && stats.duel.games > 0) {
    lines.push(
      `- ${mine} contre ${theirs} à ce poste : ${percent(stats.duel)} de victoires pour ${mine} sur ${formatInteger(stats.duel.games)} parties (${stats.reliable ? "fiable" : "peu fiable, trop peu de parties"}).`,
    );
  } else {
    lines.push(
      `- ${mine} contre ${theirs} à ce poste : aucune partie analysée, ne donne aucun pourcentage.`,
    );
  }
  if (stats.mineAtRole) {
    lines.push(
      `- ${mine} à ce poste, tous duels : ${percent(stats.mineAtRole)} sur ${formatInteger(stats.mineAtRole.games)} parties.`,
    );
  }
  if (stats.theirsAtRole) {
    lines.push(
      `- ${theirs} à ce poste, tous duels : ${percent(stats.theirsAtRole)} sur ${formatInteger(stats.theirsAtRole.games)} parties.`,
    );
  }
  return lines;
}

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
    `Données vérifiées (Data Dragon ${request.ddragonVersion}) :`,
    ...championBlock(request.champions.mine, request.allies[request.myRole] ?? "Ton champion"),
    "",
    ...championBlock(request.champions.theirs, request.enemies[request.myRole] ?? "Vis-à-vis"),
    "",
    ...statsBlock(request),
    "",
    "Écris la fiche avec l'outil « ecrire_fiche ».",
  ]
    .filter((part) => part !== null)
    .join("\n");
}
