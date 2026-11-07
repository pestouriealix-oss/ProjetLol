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
  // 3 fiches par jour : de quoi juger le coach sur une soirée, à un coût tenable.
  // Un seul compte : le sien.
  FREE: { riotAccounts: 1, draftAnalysesPerDay: 3, matchReviewsPerDay: 3 },
  // 40 fiches par jour : plus que ce qu'un joueur peut enchaîner de parties.
  // Trois comptes : le principal et deux smurfs.
  PREMIUM: { riotAccounts: 3, draftAnalysesPerDay: 40, matchReviewsPerDay: 40 },
};

export function limitsFor(plan: Plan): Limits {
  return LIMITS[plan];
}

export function canLinkRiotAccount(plan: Plan, linkedCount: number): boolean {
  return linkedCount < LIMITS[plan].riotAccounts;
}

/**
 * L'offre qui s'applique : celle payée, ou Premium offert jusqu'à une date
 * (offre fondateurs). `trialEndsAt` n'est rendu que si c'est lui qui donne
 * Premium : un abonné payant n'a pas d'« essai » à afficher.
 */
export function effectivePlan(
  stored: Plan,
  trialEndsAt: Date | null,
  now: Date = new Date(),
): { plan: Plan; trialEndsAt: Date | null } {
  if (stored !== "FREE") return { plan: stored, trialEndsAt: null };
  if (trialEndsAt && trialEndsAt > now) return { plan: "PREMIUM", trialEndsAt };
  return { plan: "FREE", trialEndsAt: null };
}

/** Vrai pour une offre payante (sert par exemple à mettre son nom en avant). */
export function isPaidPlan(plan: Plan): boolean {
  return plan !== "FREE";
}
