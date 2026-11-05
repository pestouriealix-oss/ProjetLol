import "server-only";

import { listPlayedGames, listSetGoals } from "@/lib/db/progression";
import { goalProgress, type GoalProgress } from "@/lib/stats/goals";

/** Au-delà, les parties d'un objectif ancien ne sont plus relues (l'historique reste lisible). */
const MAX_CHECKED_GAMES = 200;

/**
 * Les derniers objectifs fixés par les bilans d'un compte, chacun vérifié sur
 * les parties où il était en cours. Le premier est l'objectif actuel.
 */
export async function loadGoalProgress(
  userId: string,
  accountId: string,
  options: { goals: number },
): Promise<GoalProgress[]> {
  const goals = await listSetGoals(userId, accountId, { limit: options.goals });
  const oldest = goals.at(-1);
  if (!oldest) return [];
  const games = await listPlayedGames(userId, accountId, {
    limit: MAX_CHECKED_GAMES,
    since: oldest.setAt,
  });
  return goalProgress(goals, games);
}
