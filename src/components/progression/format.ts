import { t } from "@/i18n/fr";
import { formatDecimal, formatInteger } from "@/lib/format";
import { GOAL_RULES, type Goal, type GoalMetric } from "@/lib/stats/goals";

/** Valeur d'un indicateur à sa précision : « 6,5 », « 4 », « 55 % », « 650 ». */
export function formatMetric(metric: GoalMetric, value: number): string {
  if (metric === "KILL_PARTICIPATION") return `${formatInteger(Math.round(value))} %`;
  return GOAL_RULES[metric].step < 1 ? formatDecimal(value) : formatInteger(Math.round(value));
}

/** La cible en clair : « 6,5 CS par minute », « 4 morts au plus », « 2 pinks par partie ». */
export function formatTarget(goal: Goal): string {
  return t.progression.target[goal.metric](formatMetric(goal.metric, goal.target), goal.target);
}

/** Une moyenne : une décimale de plus que les valeurs entières (3,4 morts par partie). */
export function formatAverage(metric: GoalMetric, value: number): string {
  if (metric === "KILL_PARTICIPATION" || metric === "DAMAGE_PER_MINUTE") {
    return formatMetric(metric, value);
  }
  return formatDecimal(value);
}
