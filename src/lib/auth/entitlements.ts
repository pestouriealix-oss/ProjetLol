import type { Plan } from "@/lib/config";

/**
 * Ce que chaque offre autorise. Point d'entrée unique : aucune autre partie du
 * code ne compare directement `user.plan`.
 */
type Limits = {
  /** Comptes Riot pouvant être liés. */
  riotAccounts: number;
  /** Analyses de draft par jour. */
  draftAnalysesPerDay: number;
  /** Bilans de partie par jour. */
  matchReviewsPerDay: number;
};

const LIMITS: Record<Plan, Limits> = {
  FREE: { riotAccounts: 2, draftAnalysesPerDay: 5, matchReviewsPerDay: 5 },
  PREMIUM: { riotAccounts: 10, draftAnalysesPerDay: 100, matchReviewsPerDay: 100 },
};

export function limitsFor(plan: Plan): Limits {
  return LIMITS[plan];
}

export function canLinkRiotAccount(plan: Plan, linkedCount: number): boolean {
  return linkedCount < LIMITS[plan].riotAccounts;
}
