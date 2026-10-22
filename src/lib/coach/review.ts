import "server-only";

import { limitsFor } from "@/lib/auth/entitlements";
import type { Plan } from "@/lib/config";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { countMatchReviewsSince, saveMatchReview } from "@/lib/db/match-reviews";
import { findPlayedMatch, listRoleStats } from "@/lib/db/matches";
import { frenchSpacing } from "@/lib/format";
import { llm, MODELS } from "@/lib/llm";
import {
  MATCH_REVIEW_SYSTEM,
  MATCH_REVIEW_TOOL,
  MATCH_REVIEW_VERSION,
  matchReviewMessage,
  type MatchReview,
} from "@/lib/llm/prompts/match-review";
import { buildMatchDetail } from "@/lib/stats/match-detail";
import { rankedQueue } from "@/lib/stats/participation";
import { buildReviewFacts, type ReviewFacts } from "@/lib/stats/review";
import { loadMatchTimeline } from "@/lib/sync/match-timeline";

import type { LlmErrorKind } from "@/lib/llm/errors";

import { trackUsage } from "./usage";

export type { MatchReview };

/** Ce qui peut empêcher le bilan, tel que la page l'explique. */
export type ReviewErrorKind =
  | LlmErrorKind
  /** Limite quotidienne de bilans de l'offre atteinte. */
  | "quota"
  /** Fiches gratuites en pause : budget mensuel du site atteint. */
  | "budget"
  /** Partie introuvable pour cet utilisateur, ou illisible. */
  | "match_not_found"
  /** Partie sans poste attribué (ARAM, modes spéciaux). */
  | "not_reviewable";

export class ReviewError extends Error {
  constructor(
    readonly kind: ReviewErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ReviewError";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Bilans encore possibles sur les dernières 24 heures, selon l'offre. */
export async function remainingReviews(userId: string, plan: Plan, now = new Date()) {
  const limit = limitsFor(plan).matchReviewsPerDay;
  const used = await countMatchReviewsSince(userId, new Date(now.getTime() - DAY_MS));
  return { limit, used, remaining: Math.max(0, limit - used) };
}

const tidy = (review: MatchReview): MatchReview => ({
  summary: frenchSpacing(review.summary),
  strengths: review.strengths.map((point) => ({
    title: frenchSpacing(point.title),
    detail: frenchSpacing(point.detail),
  })),
  improvements: review.improvements.map((point) => ({
    title: frenchSpacing(point.title),
    detail: frenchSpacing(point.detail),
    options: point.options.map(frenchSpacing),
  })),
});

/**
 * Les faits d'une partie de l'utilisateur : détail Match-V5, chronologie
 * (demandée à Riot si elle manque) et habitudes du joueur à ce poste.
 */
export async function loadReviewFacts(userId: string, matchId: string): Promise<ReviewFacts> {
  const played = await findPlayedMatch(userId, matchId);
  const detail = played ? buildMatchDetail(played.details, played.puuid) : null;
  if (!played || !detail) throw new ReviewError("match_not_found", "Partie introuvable.");

  const teamOf = new Map(
    detail.teams.flatMap((team) => team.players.map((player) => [player.puuid, team.teamId])),
  );
  const [timeline, roles] = await Promise.all([
    loadMatchTimeline(
      userId,
      { id: matchId, platform: played.platform, stored: played.timeline },
      (puuid) => teamOf.get(puuid),
    ),
    listRoleStats(userId, played.accountId, "ALL"),
  ]);
  const totals = roles.find((row) => row.role === detail.me.role) ?? null;
  const facts = buildReviewFacts(
    detail,
    timeline.ok ? timeline.timeline : null,
    totals,
    rankedQueue(detail.queueId) !== null,
  );
  if (!facts) throw new ReviewError("not_reviewable", "Partie sans poste attribué.");
  return facts;
}

/**
 * Écrit le bilan d'une partie en le diffusant morceau par morceau
 * (`onPartial`), puis l'enregistre. Les faits sont transmis dès qu'ils sont
 * connus (`onFacts`), avant l'écriture.
 */
export async function writeMatchReview(
  userId: string,
  matchId: string,
  onPartial: (partial: unknown) => void,
  signal?: AbortSignal,
  onFacts: (facts: ReviewFacts) => void = () => {},
): Promise<{ id: string; review: MatchReview; facts: ReviewFacts }> {
  const facts = await loadReviewFacts(userId, matchId);
  onFacts(facts);

  const champions = await getChampionAssets();
  const name = (championName: string) => champions?.name(championName) ?? championName;

  const review = tidy(
    await llm.streamTool(
      {
        model: MODELS.matchReview,
        system: MATCH_REVIEW_SYSTEM,
        maxTokens: 1500,
        tool: MATCH_REVIEW_TOOL,
        onUsage: (usage) => trackUsage(userId, "MATCH_REVIEW", usage),
        content: matchReviewMessage(facts, {
          me: name(facts.me.championName),
          opponent: facts.opponent ? name(facts.opponent.championName) : null,
        }),
      },
      onPartial,
      signal,
    ),
  );

  const id = await saveMatchReview(userId, matchId, {
    ...review,
    facts,
    promptVersion: MATCH_REVIEW_VERSION,
  });
  if (!id) throw new ReviewError("match_not_found", "Partie introuvable.");
  return { id, review, facts };
}
