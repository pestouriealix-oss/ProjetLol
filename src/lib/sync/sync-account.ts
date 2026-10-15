import "server-only";

import { listKnownMatchIds, saveMatchForAccount } from "@/lib/db/matches";
import { recordRanks } from "@/lib/db/ranks";
import {
  findRiotAccount,
  markRiotAccountSynced,
  markRiotAccountVerified,
  RiotPlayerAlreadyLinkedError,
  updateRiotAccountProfile,
} from "@/lib/db/riot-accounts";
import type { RiotApi } from "@/lib/riot/api";
import { RiotApiError, type RiotErrorKind } from "@/lib/riot/errors";
import { extractParticipation, summarizeMatch } from "@/lib/stats/participation";

/** Parties classées regardées à chaque synchronisation. */
export const MATCHES_PER_SYNC = 20;
/** Délai minimum entre deux synchronisations d'un même compte. */
export const SYNC_COOLDOWN_SECONDS = 60;

export type SyncFailure =
  | RiotErrorKind
  /** Le compte n'existe pas ou n'appartient pas à l'utilisateur. */
  | "account_missing"
  /** Riot ne connaît pas ce Riot ID sur ce serveur. */
  | "player_unknown"
  /** Ce joueur est déjà lié sous un autre Riot ID. */
  | "player_already_linked"
  /** Synchronisé il y a trop peu de temps. */
  | "cooldown";

export type SyncResult =
  | {
      ok: true;
      newMatches: number;
      /** Vrai si Riot a demandé d'attendre avant la fin : le reste viendra au prochain passage. */
      partial: boolean;
    }
  | { ok: false; reason: SyncFailure; retryAfterSeconds?: number };

/**
 * Met un compte à jour depuis l'API Riot : identité, icône et niveau, classement, puis les
 * parties classées récentes qui manquent.
 *
 * Tout est repris sans dégât si on relance : une partie déjà enregistrée est
 * ignorée, et une interruption à mi-chemin laisse les parties déjà sauvées.
 */
export async function syncRiotAccount(
  userId: string,
  accountId: string,
  { api, now = () => new Date() }: { api: RiotApi; now?: () => Date },
): Promise<SyncResult> {
  const account = await findRiotAccount(userId, accountId);
  if (!account) return { ok: false, reason: "account_missing" };

  if (account.lastSyncedAt) {
    const elapsed = (now().getTime() - account.lastSyncedAt.getTime()) / 1000;
    if (elapsed < SYNC_COOLDOWN_SECONDS) {
      return {
        ok: false,
        reason: "cooldown",
        retryAfterSeconds: Math.ceil(SYNC_COOLDOWN_SECONDS - elapsed),
      };
    }
  }

  try {
    let puuid = account.puuid;
    if (!puuid) {
      let identity;
      try {
        identity = await api.getAccountByRiotId(
          account.platform,
          account.gameName,
          account.tagLine,
        );
      } catch (error) {
        if (error instanceof RiotApiError && error.kind === "not_found") {
          return { ok: false, reason: "player_unknown" };
        }
        throw error;
      }
      await markRiotAccountVerified(userId, accountId, identity);
      puuid = identity.puuid;
    }

    const summoner = await api.getSummoner(account.platform, puuid);
    await updateRiotAccountProfile(userId, accountId, {
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
    });

    const entries = await api.getLeagueEntries(account.platform, puuid);
    await recordRanks(
      userId,
      accountId,
      entries.map((entry) => ({
        queue: entry.queueType,
        tier: entry.tier,
        division: entry.rank,
        lp: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
      })),
    );

    const ids = await api.getRankedMatchIds(account.platform, puuid, MATCHES_PER_SYNC);
    const known = new Set(await listKnownMatchIds(userId, accountId, ids));
    const missing = ids.filter((id) => !known.has(id));

    let newMatches = 0;
    let partial = false;
    for (const matchId of missing) {
      let match;
      try {
        match = await api.getMatch(account.platform, matchId);
      } catch (error) {
        // Limite d'appels atteinte en cours de route : on garde ce qui est fait.
        if (error instanceof RiotApiError && error.kind === "rate_limited") {
          partial = true;
          break;
        }
        // Partie introuvable (purgée par Riot) : on passe à la suivante.
        if (error instanceof RiotApiError && error.kind === "not_found") continue;
        throw error;
      }
      const participation = extractParticipation(match, puuid);
      if (!participation) continue;
      const saved = await saveMatchForAccount(userId, accountId, {
        platform: account.platform,
        summary: summarizeMatch(match),
        details: match,
        participation,
      });
      if (saved) newMatches += 1;
    }

    // Une synchronisation interrompue ne déclenche pas le délai d'attente :
    // on doit pouvoir la reprendre.
    if (!partial) await markRiotAccountSynced(userId, accountId, now());
    return { ok: true, newMatches, partial };
  } catch (error) {
    if (error instanceof RiotPlayerAlreadyLinkedError) {
      return { ok: false, reason: "player_already_linked" };
    }
    if (error instanceof RiotApiError) {
      return { ok: false, reason: error.kind, retryAfterSeconds: error.retryAfterSeconds };
    }
    throw error;
  }
}
