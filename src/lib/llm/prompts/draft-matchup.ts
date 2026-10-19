import { z } from "zod";

import type { Role } from "@/lib/config";
import { formatInteger, formatPercent } from "@/lib/format";

import type { ToolSpec } from "../client";
import { ROLE_NAMES, type ChampionSheet, type GameRecord } from "./shared";

/**
 * Duel contre le vis-à-vis : ne dépend que des deux champions (et du duo en
 * bas), jamais du reste de la partie ni du joueur. Le texte est donc gardé et
 * resservi à tous ceux qui jouent ce duel sur le même patch. Version à changer
 * à chaque modification du texte ou du schéma : elle fait partie de la clé.
 */
export const DRAFT_MATCHUP_VERSION = "draft-matchup@1";

export const DRAFT_MATCHUP_SYSTEM = `Tu es un coach de League of Legends. Un joueur vient de finir sa sélection des champions et lit ta fiche pendant l'écran de chargement : il a une minute. Tu lui écris en français, en le tutoyant.

Tu écris le duel contre son vis-à-vis (même rôle en face ; en jungle, le jungler adverse ; en bas, le duo indiqué) :
- un verdict : favorable, équilibré ou défavorable pour lui ;
- un résumé en une phrase : qui domine la voie et à quel moment ça bascule ;
- les moments clés : niveaux et objets qui changent le rapport de force, des deux côtés ;
- deux ou trois façons de jouer ce duel, au choix du joueur. Chacune a un titre court et une phrase d'explication. Ce sont des options, pas des ordres : chacune doit être une vraie manière de gagner, adaptée à un style de jeu ;
- une chose à surveiller : la compétence ou la situation qui fait perdre le duel.

Ce texte sert à tous les joueurs de ce duel : ne parle que des champions indiqués, jamais des autres joueurs de la partie ni du classement du joueur.

Tu reçois des données vérifiées, à respecter :
- La fiche technique des deux champions pour le patch en cours (Data Dragon) : passif, compétences, délais de récupération par rang. Ce que tu dis de leurs compétences et de leurs délais doit s'accorder avec elle ; ne cite pas de compétence absente de la fiche.
- Quand elles existent, les statistiques de parties classées Émeraude et plus : le taux de victoire du duel et le nombre de parties. Ce taux est affiché à côté de ta fiche : ne l'écris pas. S'il est marqué fiable, accorde ton verdict avec lui (52 % ou plus, favorable ; 48 % ou moins, défavorable ; entre les deux, équilibré) et explique d'où vient l'écart. S'il est absent ou peu fiable, fonde le verdict sur les compétences.

Règles :
- Court et concret. Pas d'introduction, pas de formule de politesse, pas de généralités valables pour tous les duels.
- Aucun pourcentage ni statistique dans ton texte : les seuls chiffres permis sont les délais et les niveaux de la fiche technique. Pas d'estimation de niveau caché (MMR).
- Pour le reste (style de jeu, pics de puissance), appuie-toi sur ce qui est stable d'un patch à l'autre. Si tu n'es pas sûr d'un détail, ne l'écris pas.
- Écris les champions par leur nom français habituel.
- Typographie française : espace insécable avant « : », « ? », « ! » et « ; ».`;

const text = (max: number) => z.string().trim().min(1).max(max);

export const matchupSchema = z.object({
  verdict: z.enum(["favorable", "even", "unfavorable"]),
  summary: text(300),
  keyMoments: text(400),
  options: z
    .array(z.object({ title: text(60), detail: text(300) }))
    .min(2)
    .max(3),
  watchOut: text(300),
});

export type Matchup = z.infer<typeof matchupSchema>;

const string = { type: "string" } as const;

export const DRAFT_MATCHUP_TOOL: ToolSpec<Matchup> = {
  name: "ecrire_duel",
  description:
    "Écrit le duel contre le vis-à-vis, affiché au joueur pendant l'écran de chargement.",
  inputSchema: {
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
  parse: (input) => matchupSchema.parse(input),
};

export type MatchupRequest = {
  patch: string;
  ddragonVersion: string;
  role: Role;
  /** Noms affichés des deux champions du duel. */
  mine: string;
  theirs: string;
  /** En bas : le partenaire de chaque côté (support du tireur, tireur du support). */
  partners: { mine: string; theirs: string } | null;
  /** Fiches techniques des deux champions du duel. */
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

function statsBlock({ stats, mine, theirs }: MatchupRequest): string[] {
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

/** Le message envoyé au modèle : le duel et ses données vérifiées. */
export function draftMatchupMessage(request: MatchupRequest): string {
  return [
    `Patch ${request.patch}.`,
    `Duel au poste ${ROLE_NAMES[request.role]} : le joueur joue ${request.mine}, son vis-à-vis ${request.theirs}.`,
    request.partners
      ? `En bas, le duo du joueur est ${request.mine} avec ${request.partners.mine} ; en face, ${request.theirs} avec ${request.partners.theirs}.`
      : null,
    "",
    `Données vérifiées (Data Dragon ${request.ddragonVersion}) :`,
    ...championBlock(request.champions.mine, request.mine),
    "",
    ...championBlock(request.champions.theirs, request.theirs),
    "",
    ...statsBlock(request),
    "",
    "Écris le duel avec l'outil « ecrire_duel ».",
  ]
    .filter((part) => part !== null)
    .join("\n");
}
