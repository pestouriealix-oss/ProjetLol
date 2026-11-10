import "server-only";

import type { Platform } from "@/lib/config";
import { attemptKey, isRateLimited, recordAttempt } from "@/lib/db/auth-attempts";
import { riotApi } from "@/lib/riot";
import type { RiotId } from "@/lib/validation/riot";

import { createProfileLoader, type ProfileResult } from "./profile";

/** Profils gardés en mémoire par le serveur, partagés entre tous les joueurs. */
const profiles = createProfileLoader({ api: riotApi });

/**
 * Profils lus chez Riot par compte Gufo et par heure. De quoi passer en revue
 * les dix joueurs de plusieurs parties ; pas de quoi aspirer un classement, ni
 * épuiser à soi seul la limite d'appels partagée par tout le site. Un profil
 * déjà en mémoire ne compte pas.
 */
const LOOKUPS = { max: 40, windowSeconds: 60 * 60 };

export async function lookUpPlayer(
  userId: string,
  platform: Platform,
  riotId: RiotId,
): Promise<ProfileResult> {
  const cached = profiles.peek(platform, riotId);
  if (cached) return cached;
  const key = attemptKey("player-lookup", userId);
  if (await isRateLimited(key, LOOKUPS.max)) return { ok: false, reason: "too_many" };
  await recordAttempt(key, LOOKUPS.windowSeconds);
  return profiles.load(platform, riotId);
}

export type { ProfileFailure, ProfileResult, PublicProfile } from "./profile";
