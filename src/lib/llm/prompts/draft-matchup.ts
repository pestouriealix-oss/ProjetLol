import { z } from "zod";

import type { Role } from "@/lib/config";
import { formatInteger, formatPercent } from "@/lib/format";

import type { ToolSpec } from "../client";
import {
  ROLE_NAMES,
  SPELL_KEYS,
  type ChampionSheet,
  type GameRecord,
  modelList,
  modelText,
  ofChampion,
} from "./shared";

/**
 * Duel contre le vis-à-vis : ne dépend que des deux champions (et du duo en
 * bas), jamais du reste de la partie ni du joueur. Le texte est donc gardé et
 * resservi à tous ceux qui jouent ce duel sur le même patch. Version à changer
 * à chaque modification du texte ou du schéma : elle fait partie de la clé.
 */
export const DRAFT_MATCHUP_VERSION = "draft-matchup@5";

export const DRAFT_MATCHUP_SYSTEM = `Tu es un coach de League of Legends. Un joueur vient de finir sa sélection des champions et lit ta fiche pendant l'écran de chargement : il a une minute. Tu lui écris en français, en le tutoyant.

Tu écris le duel contre son vis-à-vis (même rôle en face ; en jungle, le jungler adverse ; en bas, le duo indiqué) :
- un verdict : favorable, équilibré ou défavorable pour lui ;
- un résumé en une phrase : qui domine la voie et à quel moment ça bascule ;
- les moments clés : niveaux et objets qui changent le rapport de force, des deux côtés ;
- deux ou trois façons de jouer ce duel, au choix du joueur. Chacune a un titre court et une phrase d'explication. Ce sont des options, pas des ordres : chacune doit être une vraie manière de gagner, adaptée à un style de jeu ;
- une chose à surveiller : la compétence ou la situation qui fait perdre le duel.

Ce texte sert à tous les joueurs de ce duel : ne parle que des champions indiqués, jamais des autres joueurs de la partie ni du classement du joueur.

Tu reçois des données vérifiées, à respecter :
- La fiche technique des deux champions pour le patch en cours (Data Dragon) : le passif, puis chaque compétence sous sa touche, avec son délai de récupération par rang et le niveau où l'ultime se débloque. Ce que tu dis des compétences, des délais et des niveaux doit s'accorder avec elle.
- Quand elles existent, les statistiques de parties classées Émeraude et plus : le taux de victoire du duel et le nombre de parties. Ce taux est affiché à côté de ta fiche : ne l'écris pas. S'il est marqué fiable, accorde ton verdict avec lui (52 % ou plus, favorable ; 48 % ou moins, défavorable ; entre les deux, équilibré) et explique d'où vient l'écart. S'il est absent ou peu fiable, fonde le verdict sur les compétences.

Les compétences, là où un coach perd sa crédibilité :
- Chaque compétence appartient au champion sous lequel elle est listée. Avant chaque phrase qui parle d'une compétence, vérifie à quel champion elle est.
- Désigne une compétence par sa touche et son champion, comme les joueurs : « le A d'Ahri », « le R de Garen », ou « ton E », « son E » quand le champion est évident. Touches d'un clavier AZERTY : A, Z, E, R. N'écris jamais le nom d'une compétence ni celui d'un passif.
- Un ultime se débloque au niveau 6 et monte aux niveaux 11 et 16, sauf si la fiche dit autre chose. Ne lui donne jamais d'autre niveau.
- Un délai que tu cites vient de la fiche, au bon rang. Dans le doute, n'en cite pas.

La voie : le message dit comment elle se joue (seul, à deux, ou en jungle). En haut et au milieu, le joueur est seul : pas d'allié de voie, pas de support.

Règles :
- Court et concret. Pas d'introduction, pas de formule de politesse, pas de généralités valables pour tous les duels.
- Longueurs : un titre fait 6 mots au plus ; le résumé, chaque option et la chose à surveiller tiennent en une phrase de 30 mots au plus ; les moments clés, en deux phrases.
- Aucun pourcentage ni statistique dans ton texte : les seuls chiffres permis sont les délais et les niveaux de la fiche technique. Pas d'estimation de niveau caché (MMR).
- Pour le reste (style de jeu, pics de puissance), appuie-toi sur ce qui est stable d'un patch à l'autre. Si tu n'es pas sûr d'un détail, ne l'écris pas.
- Écris les champions par leur nom français habituel.
- Parle comme les joueurs francophones, avec leur vocabulaire : CS (jamais « sbires »), farm, KP, kill, gank, roam, back, push, trade, lead, ward, pink (jamais « balise de contrôle »), drake, nash, héraut, grubs.
- Typographie française : espace insécable avant « : », « ? », « ! » et « ; ».`;

export const matchupSchema = z.object({
  verdict: z.enum(["favorable", "even", "unfavorable"]),
  summary: modelText(400),
  keyMoments: modelText(500),
  options: modelList(z.object({ title: modelText(80), detail: modelText(400) }), 2, 3),
  watchOut: modelText(400),
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

/** Quand l'ultime se débloque : niveau 6 pour un ultime classique à trois rangs. */
function ultimateNote(maxRank: number | null | undefined): string {
  if (maxRank === undefined || maxRank === null) return "ultime";
  if (maxRank === 3) return "ultime, débloqué au niveau 6, puis rangs aux niveaux 11 et 16";
  return `disponible dès le niveau 1, ${maxRank} rangs`;
}

/**
 * La fiche d'un champion, compétences sous leur touche AZERTY et sans leur
 * nom : le modèle les cite comme les joueurs (« le E d'Orianna ») et ne peut
 * pas prêter à l'un le sort de l'autre en recopiant un nom.
 */
function championBlock(sheet: ChampionSheet | null, fallback: string): string[] {
  if (!sheet) return [`${fallback} : fiche technique indisponible.`];
  return [
    `${sheet.name} :`,
    `- Passif ${ofChampion(sheet.name)} : ${sheet.passive.text}`,
    ...sheet.spells.map((spell) => {
      const key = SPELL_KEYS[spell.key];
      const note = spell.key === "R" ? `, ${ultimateNote(spell.maxRank)}` : "";
      const cooldown = spell.cooldown ? ` (délai ${spell.cooldown} s)` : "";
      return `- ${key} ${ofChampion(sheet.name)}${note}${cooldown} : ${spell.text}`;
    }),
  ];
}

/** Comment se joue la voie : seul, à deux, ou sans voie en jungle. */
function laneLine({ role, mine, theirs, partners }: MatchupRequest): string {
  if (role === "TOP" || role === "MID") {
    return `Voie seule : ${mine} contre ${theirs}, en un contre un. Le joueur n'a ni allié de voie ni support.`;
  }
  if (role === "JUNGLE") {
    return `Jungle : pas de voie. Le duel se joue sur les camps, les invades, les ganks et les objectifs.`;
  }
  return partners
    ? `En bas, le duo du joueur est ${mine} avec ${partners.mine} ; en face, ${theirs} avec ${partners.theirs}.`
    : `En bas, à deux contre deux : les partenaires de voie ne sont pas connus.`;
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
    laneLine(request),
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

/**
 * Le deuxième jet : le même message, suivi des erreurs relevées par le
 * contrôle (`src/lib/coach/matchup-check.ts`).
 */
export function draftMatchupCorrection(message: string, issues: string[]): string {
  return [
    message,
    "",
    "Un premier jet de ce duel contenait des erreurs. Réécris tout le duel en les corrigeant, sans en introduire d'autres :",
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
