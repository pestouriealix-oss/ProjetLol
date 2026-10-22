import { z } from "zod";

import { formatDecimal, formatInteger, formatPercent, formatSignedInteger } from "@/lib/format";
import type { ReviewFacts, ReviewLine } from "@/lib/stats/review";

import type { ToolSpec } from "../client";
import { modelList, modelText, ROLE_NAMES } from "./shared";

/**
 * Bilan d'une partie jouée : ce qui a marché, ce qui a coûté, et des façons
 * de progresser, appuyés sur les faits calculés (`src/lib/stats/review.ts`).
 * Version à changer à chaque modification du texte ou du schéma (elle est
 * enregistrée avec chaque bilan).
 */
export const MATCH_REVIEW_VERSION = "match-review@7";

export const MATCH_REVIEW_SYSTEM = `Tu es un coach de League of Legends. Le joueur vient de finir une partie et lit ton bilan en une minute. Tu lui écris en français, en le tutoyant, comme un coach exigeant mais bienveillant. Il doit en retenir une seule chose : quoi faire à la prochaine partie.

Ce que tu écris, dans cet ordre :
1. Un résumé en une phrase de 25 mots au plus : ce qui a décidé la partie pour lui.
2. L'objectif de la prochaine partie : une seule action concrète, que le joueur pourra vérifier lui-même après la partie, en une phrase de 20 mots au plus, tirée de l'axe de progrès le plus important. Par exemple « Zéro mort dans la minute qui précède un dragon », pas « Mourir moins ».
3. Zéro à deux points forts, sur son jeu à lui, pas sur le résultat de l'équipe. Seulement ce qui est vraiment bon : au moins 10 % au-dessus de ses habitudes, ou nettement devant son vis-à-vis. S'il n'y en a pas, n'en écris aucun : un point fort inventé fait perdre confiance dans tout le bilan.
4. Un ou deux axes de progrès, le plus important d'abord. Chacun a un titre, une phrase qui cite le chiffre qui le montre, et deux façons différentes de s'y prendre, au choix du joueur. Ce sont des options, pas des ordres.

Tu reçois uniquement des faits vérifiés, tirés des données officielles de la partie :
- Ses chiffres et ceux de son vis-à-vis (même poste en face).
- Les écarts avec son vis-à-vis à 10 et 15 minutes (or, CS, expérience), quand la partie est assez longue.
- Ses morts : quand, combien avant 15 minutes, combien juste avant un objectif neutre (drake, nash, héraut, grubs) pris par l'adversaire.
- L'écart d'or des équipes au fil de la partie et les objectifs pris.
- Ses habitudes à ce poste, seulement quand il a assez d'autres parties classées.

Règles :
- Chaque point s'appuie sur un fait reçu. Ne cite que des chiffres présents dans les faits, arrondis comme eux. N'invente rien sur ce qui ne figure pas dans les faits (placement, combats précis, communication).
- Compare d'abord le joueur à ses habitudes quand tu les as, sinon à son vis-à-vis. Un écart de moins de 10 % n'est ni un point fort ni un point faible.

Lis la partie comme un coach, pas comme une liste de chiffres :
- Pèse les compromis. Un retard de CS n'est pas une faute si le joueur a eu plus d'impact que son vis-à-vis : plus de KP, plus de kills et d'assists avant 15 minutes, plus d'objectifs, plus d'or en fin de partie. Dis-le comme un point fort, et l'axe de progrès devient de garder cet impact en perdant moins de farm (farmer entre deux actions, ne pas laisser de camps ou de vagues). À l'inverse, beaucoup de CS avec peu d'impact (KP et objectifs bas) est de l'overfarming : signale-le.
- Tiens compte du poste. En jungle, ganks, drakes, grubs et héraut comptent autant que le farm. En support, ignore les CS : regarde la vision, les pinks et la KP. Sur les autres postes, le farm et l'or restent la base, mais un roam qui rapporte des kills vaut plus que quelques CS.
- Parle de ce qu'il contrôle. Ne blâme jamais ses coéquipiers.
- Aucune estimation de niveau caché (MMR), aucune comparaison avec un rang.
- Longueurs : un titre fait 5 mots au plus ; une explication, 25 mots au plus ; une option, 15 mots au plus. Pas d'introduction, pas de formule de politesse, pas de généralités valables pour toutes les parties.
- Écris les champions par leur nom français habituel.
- Parle comme les joueurs francophones, avec leur vocabulaire : CS (jamais « sbires »), farm, KP, kill, gank, roam, back, push, trade, lead, ward, pink (jamais « balise de contrôle »), drake, nash, héraut, grubs.
- Typographie française : espace insécable avant « : », « ? », « ! » et « ; ».`;

const point = z.object({ title: modelText(60), detail: modelText(250) });

export const matchReviewSchema = z.object({
  summary: modelText(250),
  focus: modelText(200),
  strengths: modelList(point, 0, 2),
  improvements: modelList(point.extend({ options: modelList(modelText(150), 2, 2) }), 1, 2),
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
    required: ["summary", "focus", "strengths", "improvements"],
    properties: {
      summary: string,
      focus: string,
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
    `- CS par minute : ${formatDecimal(line.csPerMinute)}`,
    `- Or par minute : ${formatInteger(Math.round(line.goldPerMinute))}`,
    `- Dégâts aux champions par minute : ${formatInteger(Math.round(line.damagePerMinute))} (${formatPercent(line.damageShare)} de son équipe)`,
    `- KP (participation aux kills) : ${formatPercent(line.killParticipation)}`,
    `- Score de vision par minute : ${formatDecimal(line.visionPerMinute)}, pinks achetées : ${line.controlWards}`,
    ...(line.soloKills !== null ? [`- Kills en solo : ${line.soloKills}`] : []),
    ...(line.objectiveTakedowns
      ? [
          `- Participation aux objectifs : drakes ${line.objectiveTakedowns.dragons}, nash ${line.objectiveTakedowns.barons}, héraut ${line.objectiveTakedowns.heralds}, grubs ${line.objectiveTakedowns.grubs}, tours ${line.objectiveTakedowns.towers}`,
        ]
      : []),
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
        `- à ${checkpoint.minute} minutes : or ${formatSignedInteger(checkpoint.goldDiff)}, CS ${formatSignedInteger(checkpoint.csDiff)}, expérience ${formatSignedInteger(checkpoint.xpDiff)}`,
      );
    }
  } else {
    parts.push("Écarts avec le vis-à-vis en phase de voie : indisponibles.");
  }
  const impact = facts.impact;
  if (impact?.takedownsBefore15) {
    const { me, opponent } = impact.takedownsBefore15;
    parts.push(
      `Kills et assists avant 15 minutes : ${me} pour le joueur${opponent !== null ? `, ${opponent} pour son vis-à-vis` : ""}.`,
    );
  }
  if (impact && impact.goldDiffEnd !== null) {
    parts.push(
      `Or en fin de partie : ${formatSignedInteger(impact.goldDiffEnd)} pour le joueur face à son vis-à-vis.`,
    );
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
    `Objectifs (son équipe / adversaires) : drakes ${ours.dragons}/${theirs.dragons}, grubs ${ours.grubs}/${theirs.grubs}, héraut ${ours.heralds}/${theirs.heralds}, nash ${ours.barons}/${theirs.barons}, tours ${ours.towers}/${theirs.towers}.`,
    "",
  );

  const { habits } = facts;
  parts.push(
    habits
      ? [
          `Ses habitudes à ce poste (${formatInteger(habits.games)} autres parties classées) :`,
          `- victoires : ${formatPercent(habits.winRate)}`,
          `- CS par minute : ${formatDecimal(habits.csPerMinute)}`,
          `- morts par partie : ${formatDecimal(habits.deathsPerGame)}`,
          `- KP : ${formatPercent(habits.killParticipation)}`,
          `- score de vision par minute : ${formatDecimal(habits.visionPerMinute)}`,
          `- dégâts aux champions par minute : ${formatInteger(Math.round(habits.damagePerMinute))}`,
        ].join("\n")
      : "Ses habitudes à ce poste : pas assez d'autres parties classées.",
    "",
    "Écris le bilan avec l'outil « ecrire_bilan ».",
  );

  return parts.filter((part) => part !== null).join("\n");
}
