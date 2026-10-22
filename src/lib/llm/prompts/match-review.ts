import { z } from "zod";

import { formatDecimal, formatInteger, formatPercent, formatSignedInteger } from "@/lib/format";
import type { ReviewFacts, ReviewLine } from "@/lib/stats/review";

import type { ToolSpec } from "../client";
import { ROLE_NAMES } from "./shared";

/**
 * Bilan d'une partie jouée : ce qui a marché, ce qui a coûté, et des façons
 * de progresser, appuyés sur les faits calculés (`src/lib/stats/review.ts`).
 * Version à changer à chaque modification du texte ou du schéma (elle est
 * enregistrée avec chaque bilan).
 */
export const MATCH_REVIEW_VERSION = "match-review@1";

export const MATCH_REVIEW_SYSTEM = `Tu es un coach de League of Legends. Le joueur vient de finir une partie et lit ton bilan. Tu lui écris en français, en le tutoyant, comme un coach exigeant mais bienveillant.

Ce que tu écris :
1. Un résumé en deux phrases : ce qui a décidé la partie pour lui, en bien ou en mal.
2. Un à trois points forts : ce qu'il a bien fait, chacun avec un titre court et une phrase qui cite le chiffre qui le montre.
3. Un à trois axes de progrès, du plus important au moins important. Chacun a un titre court, une phrase qui cite le chiffre qui le montre, et deux ou trois façons concrètes de s'y prendre à la prochaine partie, au choix du joueur. Ce sont des options, pas des ordres.

Tu reçois uniquement des faits vérifiés, tirés des données officielles de la partie :
- Ses chiffres et ceux de son vis-à-vis (même poste en face).
- Les écarts avec son vis-à-vis à 10 et 15 minutes (or, sbires, expérience), quand la partie est assez longue.
- Ses morts : quand, combien avant 15 minutes, combien juste avant un objectif pris par l'adversaire.
- L'écart d'or des équipes au fil de la partie et les objectifs pris.
- Ses habitudes à ce poste sur ses autres parties classées, quand il en a.

Règles :
- Chaque point s'appuie sur un fait reçu. Ne cite que des chiffres présents dans les faits, arrondis comme eux. N'invente rien sur ce qui ne figure pas dans les faits (placement, combats précis, communication).
- Compare d'abord le joueur à lui-même (ses habitudes), puis à son vis-à-vis. Un écart de moins de 10 % avec ses habitudes n'est ni un point fort ni un point faible.
- Parle de ce qu'il contrôle. Ne blâme jamais ses coéquipiers. Une défaite peut contenir de vrais points forts, une victoire de vrais axes de progrès.
- Aucune estimation de niveau caché (MMR), aucune comparaison avec un rang.
- Court et concret. Pas d'introduction, pas de formule de politesse, pas de généralités valables pour toutes les parties.
- Écris les champions par leur nom français habituel.
- Typographie française : espace insécable avant « : », « ? », « ! » et « ; ».`;

const text = (max: number) => z.string().trim().min(1).max(max);

const point = z.object({ title: text(60), detail: text(300) });

export const matchReviewSchema = z.object({
  summary: text(400),
  strengths: z.array(point).min(1).max(3),
  improvements: z
    .array(point.extend({ options: z.array(text(200)).min(2).max(3) }))
    .min(1)
    .max(3),
});

export type MatchReview = z.infer<typeof matchReviewSchema>;

const string = { type: "string" } as const;
const pointSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "detail"],
  properties: { title: string, detail: string },
} as const;

export const MATCH_REVIEW_TOOL: ToolSpec<MatchReview> = {
  name: "ecrire_bilan",
  description: "Écrit le bilan de la partie affiché au joueur.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "strengths", "improvements"],
    properties: {
      summary: string,
      strengths: { type: "array", items: pointSchema },
      improvements: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "detail", "options"],
          properties: {
            title: string,
            detail: string,
            options: { type: "array", items: string },
          },
        },
      },
    },
  },
  parse: (input) => matchReviewSchema.parse(input),
};

const minuteOf = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
};

function lineBlock(label: string, champion: string, line: ReviewLine): string[] {
  return [
    `${label} (${champion}) :`,
    `- K/D/A : ${line.kills}/${line.deaths}/${line.assists}`,
    `- Sbires et monstres par minute : ${formatDecimal(line.csPerMinute)}`,
    `- Or par minute : ${formatInteger(Math.round(line.goldPerMinute))}`,
    `- Dégâts aux champions par minute : ${formatInteger(Math.round(line.damagePerMinute))} (${formatPercent(line.damageShare)} de son équipe)`,
    `- Participation aux éliminations : ${formatPercent(line.killParticipation)}`,
    `- Score de vision par minute : ${formatDecimal(line.visionPerMinute)}, balises de contrôle achetées : ${line.controlWards}`,
  ];
}

/** Le message envoyé au modèle : les faits de la partie, en clair. */
export function matchReviewMessage(
  facts: ReviewFacts,
  names: { me: string; opponent: string | null },
): string {
  const parts: (string | null)[] = [
    `Patch ${facts.patch}. ${facts.win ? "Victoire" : "Défaite"} en ${formatInteger(Math.round(facts.durationMinutes))} minutes.`,
    `Le joueur jouait ${names.me} au poste ${ROLE_NAMES[facts.role]}${names.opponent ? `, contre ${names.opponent}` : ""}.`,
    "",
    ...lineBlock("Le joueur", names.me, facts.me),
    "",
    ...(facts.opponent
      ? lineBlock("Son vis-à-vis", names.opponent ?? facts.opponent.championName, facts.opponent)
      : ["Vis-à-vis : inconnu."]),
    "",
  ];

  if (facts.lane.length > 0) {
    parts.push("Écarts avec le vis-à-vis (positif : le joueur est devant) :");
    for (const checkpoint of facts.lane) {
      parts.push(
        `- à ${checkpoint.minute} minutes : or ${formatSignedInteger(checkpoint.goldDiff)}, sbires ${formatSignedInteger(checkpoint.csDiff)}, expérience ${formatSignedInteger(checkpoint.xpDiff)}`,
      );
    }
  } else {
    parts.push("Écarts avec le vis-à-vis en phase de voie : indisponibles.");
  }
  parts.push("");

  const { deaths } = facts;
  parts.push(
    deaths.times.length > 0
      ? `Morts à ${deaths.times.map(minuteOf).join(", ")} : ${deaths.beforeMinute15} avant 15 minutes, ${deaths.beforeEnemyObjective} dans la minute avant un objectif neutre pris par l'adversaire.`
      : `Morts : ${facts.me.deaths}${facts.me.deaths > 0 ? " (moments indisponibles)" : ""}.`,
  );

  if (facts.teamGold) {
    const gold = facts.teamGold;
    parts.push(
      `Écart d'or de son équipe : ${gold.at10 !== null ? `${formatSignedInteger(gold.at10)} à 10 minutes, ` : ""}${gold.at20 !== null ? `${formatSignedInteger(gold.at20)} à 20 minutes, ` : ""}${formatSignedInteger(gold.final)} à la fin ; plus grande avance ${formatSignedInteger(gold.biggestLead.gold)} à ${gold.biggestLead.minute} minutes, plus grand retard ${formatSignedInteger(gold.biggestDeficit.gold)} à ${gold.biggestDeficit.minute} minutes.`,
    );
  }
  const { ours, theirs } = facts.objectives;
  parts.push(
    `Objectifs (son équipe / adversaires) : dragons ${ours.dragons}/${theirs.dragons}, larves ${ours.grubs}/${theirs.grubs}, héraut ${ours.heralds}/${theirs.heralds}, nashor ${ours.barons}/${theirs.barons}, tours ${ours.towers}/${theirs.towers}.`,
    "",
  );

  const { habits } = facts;
  parts.push(
    habits
      ? [
          `Ses habitudes à ce poste (${formatInteger(habits.games)} autres parties classées) :`,
          `- victoires : ${formatPercent(habits.winRate)}`,
          `- sbires et monstres par minute : ${formatDecimal(habits.csPerMinute)}`,
          `- morts par partie : ${formatDecimal(habits.deathsPerGame)}`,
          `- participation aux éliminations : ${formatPercent(habits.killParticipation)}`,
          `- score de vision par minute : ${formatDecimal(habits.visionPerMinute)}`,
          `- dégâts aux champions par minute : ${formatInteger(Math.round(habits.damagePerMinute))}`,
        ].join("\n")
      : "Ses habitudes à ce poste : pas assez d'autres parties classées.",
    "",
    "Écris le bilan avec l'outil « ecrire_bilan ».",
  );

  return parts.filter((part) => part !== null).join("\n");
}
