import "server-only";

import { saveMatchTimeline } from "@/lib/db/matches";
import type { Platform } from "@/lib/config";
import { riotApi } from "@/lib/riot";
import { RiotApiError, type RiotErrorKind } from "@/lib/riot/errors";
import { reduceTimeline, reducedTimelineSchema, type ReducedTimeline } from "@/lib/stats/timeline";

/**
 * La chronologie réduite d'une partie : celle déjà enregistrée, sinon
 * demandée une fois à Riot puis enregistrée pour les visites suivantes.
 */
export async function loadMatchTimeline(
  userId: string,
  match: { id: string; platform: Platform; stored: unknown },
  teamOf: (puuid: string) => number | undefined,
): Promise<{ ok: true; timeline: ReducedTimeline } | { ok: false; reason: RiotErrorKind }> {
  const stored = reducedTimelineSchema.safeParse(match.stored);
  if (stored.success) return { ok: true, timeline: stored.data };

  try {
    const raw = await riotApi.getMatchTimeline(match.platform, match.id);
    const timeline = reduceTimeline(raw, teamOf);
    await saveMatchTimeline(userId, match.id, timeline);
    return { ok: true, timeline };
  } catch (error) {
    if (error instanceof RiotApiError) return { ok: false, reason: error.kind };
    throw error;
  }
}
