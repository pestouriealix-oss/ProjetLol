import type { Role } from "@/lib/config";
import type { Matchup } from "@/lib/llm/prompts/draft-matchup";
import { SPELL_KEYS, ofChampion, type ChampionSheet } from "@/lib/llm/prompts/shared";

/**
 * Le contrôle du texte de duel avant de l'afficher et de le garder pour les
 * joueurs suivants. Il ne juge pas le conseil, seulement ce qui se vérifie
 * contre les données : une compétence prêtée au mauvais champion, un allié de
 * voie au milieu, un ultime au niveau 9, un délai inventé, un champion hors du
 * duel. Chaque erreur est dite au modèle, qui réécrit.
 */

export type MatchupContext = {
  role: Role;
  /** Fiches Data Dragon des deux champions du duel. */
  sheets: (ChampionSheet | null)[];
  /** Les champions dont le texte peut parler : le duel, et les deux duos en bas. */
  allowed: string[];
  /** Tous les champions du jeu, par nom affiché. */
  roster: string[];
};

const ULTIMATE_LEVELS = new Set([6, 11, 16]);

/** Espaces insécables et apostrophes typographiques ramenés à leur forme simple. */
const plain = (value: string) => value.replace(/[  ]/g, " ").replace(/[’ʼ]/g, "'");

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Le mot tel quel, pas au milieu d'un autre (« Vi » n'est pas dans « Viego »). */
const wordPattern = (word: string, flags = "u") =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escape(word)}(?![\\p{L}\\p{N}])`, flags);

function matchupText(matchup: Matchup): string {
  return plain(
    [
      matchup.summary,
      matchup.keyMoments,
      ...matchup.options.flatMap((option) => [option.title, option.detail]),
      matchup.watchOut,
    ].join("\n"),
  );
}

/**
 * Un nom de compétence dans le texte : en plusieurs mots, quelle que soit la
 * casse ; en un seul, avec sa majuscule (« Shunpo », pas le mot « préparation »).
 * Un nom à préfixe (« Commande : Onde de choc ») compte aussi sans son préfixe.
 */
function mentions(text: string, name: string): boolean {
  const clean = plain(name).trim();
  const forms = [clean];
  const tail = clean.split(":").at(-1)?.trim();
  if (tail && tail !== clean && /\s/.test(tail)) forms.push(tail);
  return forms.some(
    (form) =>
      [...form].length >= 4 &&
      (/[\s':]/.test(form) ? wordPattern(form, "iu") : wordPattern(form)).test(text),
  );
}

function spellNameIssues(text: string, sheets: (ChampionSheet | null)[]): string[] {
  const issues: string[] = [];
  for (const sheet of sheets) {
    if (!sheet) continue;
    const of = ofChampion(sheet.name);
    if (mentions(text, sheet.passive.name)) {
      issues.push(
        `« ${sheet.passive.name} » est le nom du passif ${of} : écris « le passif ${of} ».`,
      );
    }
    for (const spell of sheet.spells) {
      if (!mentions(text, spell.name)) continue;
      issues.push(
        `« ${spell.name} » est le nom du ${SPELL_KEYS[spell.key]} ${of} : écris « le ${SPELL_KEYS[spell.key]} ${of} », jamais le nom d'une compétence.`,
      );
    }
  }
  return issues;
}

function laneIssues(text: string, role: Role): string[] {
  if (role === "TOP" || role === "MID") {
    return /alli[ée]e?s? de voie|\bton (?:support|duo|adc|tireur)\b/i.test(text)
      ? ["En haut et au milieu, le joueur est seul en voie : il n'a ni allié de voie ni support."]
      : [];
  }
  if (role === "JUNGLE") {
    return /alli[ée]e?s? de voie/i.test(text)
      ? ["En jungle, le joueur n'a pas de voie ni d'allié de voie."]
      : [];
  }
  return [];
}

function intruderIssues(text: string, allowed: string[], roster: string[]): string[] {
  const inDuel = new Set(allowed.map((name) => name.toLowerCase()));
  // Un nom du duel peut en contenir un autre (« Yi » dans « Maître Yi ») : on l'ôte d'abord.
  const rest = allowed.reduce((value, own) => value.split(own).join(" "), text);
  return roster
    .filter((name) => !inDuel.has(name.toLowerCase()))
    .filter((name) => wordPattern(name).test(rest))
    .map(
      (name) =>
        `${name} ne joue pas ce duel : ne parle que de ${allowed.join(", ")}, et de rien d'autre.`,
    );
}

function ultimateIssues(text: string, sheets: (ChampionSheet | null)[]): string[] {
  // Un ultime pris dès le niveau 1 (Jayce, Elise, Udyr…) : pas de palier à vérifier.
  const classic = sheets.every((sheet) =>
    (sheet?.spells ?? []).every(
      (spell) =>
        spell.key !== "R" ||
        spell.maxRank === undefined ||
        spell.maxRank === null ||
        spell.maxRank === 3,
    ),
  );
  if (!classic) return [];
  const levels = [
    ...text.matchAll(
      /[Nn]iveau\s+(\d{1,2})\s*[:,]?\s*(?:le |son |ton |leur |l')?(?:R\b|[Uu]lti)/gu,
    ),
    ...text.matchAll(
      /(?:\bR\b|[Uu]ltime|[Uu]lti\b)[^.;!?\n]{0,25}?(?:au|dès le|à partir du) niveau\s+(\d{1,2})/gu,
    ),
  ].map((match) => Number(match[1]));
  return [...new Set(levels.filter((level) => !ULTIMATE_LEVELS.has(level)))].map(
    (level) =>
      `Un ultime se débloque au niveau 6, puis monte aux niveaux 11 et 16 : « niveau ${level} » ne colle pas.`,
  );
}

/** Les nombres des données : délais par rang, et durées citées dans les descriptions. */
function knownNumbers(sheets: (ChampionSheet | null)[]): Set<number> {
  const numbers = new Set<number>();
  const collect = (value: string) => {
    for (const match of value.matchAll(/\d+(?:[.,]\d+)?/g)) {
      numbers.add(Number(match[0].replace(",", ".")));
    }
  };
  for (const sheet of sheets) {
    if (!sheet) continue;
    collect(sheet.passive.text);
    for (const spell of sheet.spells) {
      collect(spell.cooldown);
      collect(spell.text);
    }
  }
  return numbers;
}

function secondsIssues(text: string, sheets: (ChampionSheet | null)[]): string[] {
  const known = knownNumbers(sheets);
  const cited = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s?(?:s|sec|secondes?)(?![\p{L}])/gu)].map(
    (match) => match[1]!,
  );
  return [...new Set(cited)]
    .filter((value) => !known.has(Number(value.replace(",", "."))))
    .map(
      (value) =>
        `« ${value} s » ne figure pas dans les données du patch : prends le délai de la fiche, au bon rang, ou n'en cite pas.`,
    );
}

/** Ce qui cloche dans le texte du duel ; une liste vide s'il passe le contrôle. */
export function matchupIssues(matchup: Matchup, context: MatchupContext): string[] {
  const text = matchupText(matchup);
  const issues = [
    ...spellNameIssues(text, context.sheets),
    ...laneIssues(text, context.role),
    ...intruderIssues(text, context.allowed, context.roster),
    ...ultimateIssues(text, context.sheets),
    ...secondsIssues(text, context.sheets),
  ];
  if (/\d\s?%/.test(text))
    issues.push("Aucun pourcentage dans le texte : la statistique est affichée à côté.");
  if (/\b(?:le|la|ta|sa|son|ton|du|au|leur|tes|ses) [QW]\b/.test(text)) {
    issues.push("Touches d'un clavier AZERTY : A au lieu de Q, Z au lieu de W.");
  }
  return [...new Set(issues)];
}
