import { z } from "zod";

import type { Role } from "@/lib/config";

/**
 * L'objectif chiffré qu'un bilan fixe pour les parties suivantes, sa
 * vérification partie par partie, et les tendances des mêmes indicateurs.
 * Tout se calcule avec les chiffres de fin de partie (pas de chronologie) :
 * chaque partie synchronisée peut être vérifiée. Fonctions pures.
 */

export const GOAL_METRICS = [
  "CS_PER_MINUTE",
  "DEATHS",
  "KILL_PARTICIPATION",
  "VISION_PER_MINUTE",
  "CONTROL_WARDS",
  "DAMAGE_PER_MINUTE",
] as const;
export type GoalMetric = (typeof GOAL_METRICS)[number];

type MetricRule = {
  /** Atteindre au moins la cible, ou ne pas la dépasser. */
  direction: "AT_LEAST" | "AT_MOST";
  /** Cibles possibles : une cible hors de ces bornes est ramenée dedans. */
  min: number;
  max: number;
  /** Précision de la cible et de la comparaison (celle de l'affichage). */
  step: number;
};

/**
 * Unités des cibles, celles que le joueur lit : CS par minute (6,5), morts par
 * partie (4), KP en pourcentage (55), score de vision par minute (1,2), pinks
 * achetées par partie (2), dégâts aux champions par minute (650).
 */
export const GOAL_RULES: Record<GoalMetric, MetricRule> = {
  CS_PER_MINUTE: { direction: "AT_LEAST", min: 1, max: 12, step: 0.1 },
  DEATHS: { direction: "AT_MOST", min: 0, max: 12, step: 1 },
  KILL_PARTICIPATION: { direction: "AT_LEAST", min: 10, max: 95, step: 1 },
  VISION_PER_MINUTE: { direction: "AT_LEAST", min: 0.2, max: 5, step: 0.1 },
  CONTROL_WARDS: { direction: "AT_LEAST", min: 1, max: 8, step: 1 },
  DAMAGE_PER_MINUTE: { direction: "AT_LEAST", min: 100, max: 3000, step: 10 },
};

/** Une partie plus courte est un « remake » : elle ne compte ni pour un objectif ni pour une tendance. */
export const MIN_COUNTED_SECONDS = 10 * 60;

export const goalSchema = z.object({
  metric: z.enum(GOAL_METRICS),
  target: z.number(),
});
export type Goal = z.infer<typeof goalSchema>;

/** Arrondi à la précision de l'indicateur, sans résidu flottant (6,500000001). */
function roundTo(value: number, step: number): number {
  const decimals = step < 1 ? Math.round(-Math.log10(step)) : 0;
  return Number((Math.round(value / step) * step).toFixed(decimals));
}

/** Ramène la cible du modèle dans les bornes de l'indicateur, à sa précision. */
export function normalizeGoal(goal: Goal): Goal {
  const rule = GOAL_RULES[goal.metric];
  const target = Number.isFinite(goal.target) ? goal.target : rule.min;
  return {
    metric: goal.metric,
    target: roundTo(Math.min(rule.max, Math.max(rule.min, target)), rule.step),
  };
}

/** Les chiffres d'une partie dont on tire chaque indicateur. */
export type GameNumbers = {
  durationSeconds: number;
  cs: number;
  deaths: number;
  /** De 0 à 1. */
  killParticipation: number;
  visionScore: number;
  damageToChampions: number;
  /** Pinks achetées ; `null` si la partie enregistrée ne le dit pas. */
  controlWards: number | null;
};

/** La valeur d'un indicateur sur une partie, dans l'unité de sa cible, à sa précision. */
export function metricValue(metric: GoalMetric, game: GameNumbers): number | null {
  const minutes = Math.max(1, game.durationSeconds / 60);
  const raw = {
    CS_PER_MINUTE: game.cs / minutes,
    DEATHS: game.deaths,
    KILL_PARTICIPATION: game.killParticipation * 100,
    VISION_PER_MINUTE: game.visionScore / minutes,
    CONTROL_WARDS: game.controlWards,
    DAMAGE_PER_MINUTE: game.damageToChampions / minutes,
  }[metric];
  return raw === null ? null : roundTo(raw, GOAL_RULES[metric].step);
}

/** Vrai si la valeur tient l'objectif. */
export function meetsGoal(goal: Goal, value: number): boolean {
  return GOAL_RULES[goal.metric].direction === "AT_LEAST"
    ? value >= goal.target
    : value <= goal.target;
}

/** Une partie jouée, avec ce qu'il faut pour la situer et la vérifier. */
export type PlayedGame = GameNumbers & {
  matchId: string;
  startedAt: Date;
  role: Role | null;
  win: boolean;
  championName: string;
};

/** Un objectif fixé par un bilan. */
export type SetGoal = Goal & {
  reviewId: string;
  /** Partie dont le bilan a fixé l'objectif. */
  matchId: string;
  /** Poste de cette partie : l'objectif se vérifie sur les parties à ce poste. */
  role: Role;
  championName: string;
  /** La phrase du coach. */
  text: string | null;
  /** Moment où le bilan a été écrit : l'objectif vaut pour les parties commencées après. */
  setAt: Date;
};

export type GoalCheck = {
  matchId: string;
  startedAt: Date;
  championName: string;
  win: boolean;
  value: number;
  met: boolean;
};

export type GoalProgress = {
  goal: SetGoal;
  /** Parties vérifiées, de la plus récente à la plus ancienne. */
  checks: GoalCheck[];
  met: number;
  /** Vrai pour l'objectif le plus récent : celui que le joueur suit en ce moment. */
  current: boolean;
};

/**
 * Chaque objectif, vérifié sur les parties où il était l'objectif en cours :
 * commencées après l'écriture de son bilan et avant l'objectif suivant, au
 * même poste, hors remakes. Une partie dont l'indicateur manque est ignorée.
 * Les objectifs arrivent du plus récent au plus ancien, et repartent ainsi.
 */
export function goalProgress(goals: SetGoal[], games: PlayedGame[]): GoalProgress[] {
  const sorted = [...goals].sort((a, b) => b.setAt.getTime() - a.setAt.getTime());
  return sorted.map((goal, index) => {
    const until = sorted[index - 1]?.setAt.getTime() ?? Infinity;
    const checks: GoalCheck[] = [];
    for (const game of [...games].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())) {
      const start = game.startedAt.getTime();
      if (start <= goal.setAt.getTime() || start >= until) continue;
      if (game.role !== goal.role || game.durationSeconds < MIN_COUNTED_SECONDS) continue;
      const value = metricValue(goal.metric, game);
      if (value === null) continue;
      checks.push({
        matchId: game.matchId,
        startedAt: game.startedAt,
        championName: game.championName,
        win: game.win,
        value,
        met: meetsGoal(goal, value),
      });
    }
    return {
      goal,
      checks,
      met: checks.filter((check) => check.met).length,
      current: index === 0,
    };
  });
}

/** Indicateurs suivis par poste : en support, les CS ne disent rien, les pinks beaucoup. */
export const TREND_METRICS: Record<Role, GoalMetric[]> = {
  TOP: ["CS_PER_MINUTE", "DEATHS", "KILL_PARTICIPATION", "VISION_PER_MINUTE"],
  JUNGLE: ["CS_PER_MINUTE", "DEATHS", "KILL_PARTICIPATION", "VISION_PER_MINUTE"],
  MID: ["CS_PER_MINUTE", "DEATHS", "KILL_PARTICIPATION", "VISION_PER_MINUTE"],
  ADC: ["CS_PER_MINUTE", "DEATHS", "KILL_PARTICIPATION", "VISION_PER_MINUTE"],
  SUPPORT: ["VISION_PER_MINUTE", "CONTROL_WARDS", "KILL_PARTICIPATION", "DEATHS"],
};

/** Parties récentes comparées aux précédentes dans une tendance. */
export const RECENT_GAMES = 5;
/** En dessous, une courbe ne montre rien de plus que la liste des parties. */
export const MIN_TREND_GAMES = 3;

export type TrendPoint = {
  matchId: string;
  startedAt: Date;
  championName: string;
  win: boolean;
  value: number;
};

export type Trend = {
  metric: GoalMetric;
  /** De la plus ancienne à la plus récente. */
  points: TrendPoint[];
  average: number;
  /** Moyenne des dernières parties et des précédentes, quand il y en a assez des deux côtés. */
  recent: { average: number; earlier: number; better: boolean | null } | null;
};

const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length;

/**
 * Courbe d'un indicateur sur les parties d'un poste (hors remakes), avec la
 * moyenne, et la comparaison des dernières parties avec les précédentes :
 * `better` dit si l'écart va dans le bon sens, `null` s'il est négligeable
 * (moins d'un pas de précision).
 */
export function buildTrend(metric: GoalMetric, games: PlayedGame[], role: Role): Trend | null {
  const points: TrendPoint[] = [];
  for (const game of [...games].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())) {
    if (game.role !== role || game.durationSeconds < MIN_COUNTED_SECONDS) continue;
    const value = metricValue(metric, game);
    if (value === null) continue;
    points.push({
      matchId: game.matchId,
      startedAt: game.startedAt,
      championName: game.championName,
      win: game.win,
      value,
    });
  }
  if (points.length < MIN_TREND_GAMES) return null;

  const rule = GOAL_RULES[metric];
  const values = points.map((point) => point.value);
  const earlierValues = values.slice(0, -RECENT_GAMES);
  let recent: Trend["recent"] = null;
  if (earlierValues.length >= RECENT_GAMES) {
    const recentAverage = mean(values.slice(-RECENT_GAMES));
    const earlier = mean(earlierValues);
    const gap = recentAverage - earlier;
    recent = {
      average: recentAverage,
      earlier,
      better: Math.abs(gap) < rule.step ? null : rule.direction === "AT_LEAST" ? gap > 0 : gap < 0,
    };
  }
  return { metric, points, average: mean(values), recent };
}

/** Le poste à montrer par défaut : celui de l'objectif en cours, sinon le plus joué récemment. */
export function defaultTrendRole(games: PlayedGame[], goalRole: Role | null): Role | null {
  if (goalRole) return goalRole;
  const counts = new Map<Role, number>();
  for (const game of games) {
    if (game.role) counts.set(game.role, (counts.get(game.role) ?? 0) + 1);
  }
  let best: Role | null = null;
  for (const [role, count] of counts) {
    if (best === null || count > (counts.get(best) ?? 0)) best = role;
  }
  return best;
}
