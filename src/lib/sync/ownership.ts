import "server-only";

import {
  findRiotAccount,
  markRiotAccountOwned,
  markRiotAccountVerified,
  RiotPlayerAlreadyLinkedError,
  saveOwnershipChallenge,
  updateRiotAccountProfile,
} from "@/lib/db/riot-accounts";
import type { RiotApi } from "@/lib/riot/api";
import { RiotApiError, type RiotErrorKind } from "@/lib/riot/errors";

/**
 * Preuve qu'un compte Riot appartient bien au joueur, sans connexion chez
 * Riot : on lui demande de mettre une icône de départ précise sur son compte,
 * puis on vérifie auprès de Riot (Summoner-V4) qu'elle y est.
 */

/** Icônes de départ (Data Dragon 0 à 28) : tout compte les possède. */
export const STARTER_ICON_COUNT = 29;
/** Temps laissé pour changer d'icône. */
export const CHALLENGE_MINUTES = 30;
/**
 * Riot met parfois plusieurs minutes à montrer une nouvelle icône : passé le
 * délai, l'icône demandée vaut encore preuve pendant ce temps-là.
 */
export const LATE_GRACE_MINUTES = 24 * 60;

const graceEnd = (expiresAt: Date) => new Date(expiresAt.getTime() + LATE_GRACE_MINUTES * 60_000);

/** Une icône de départ au hasard, différente de celle que le compte affiche déjà. */
export function pickChallengeIcon(current: number | null, random: () => number = Math.random) {
  const candidates = Array.from({ length: STARTER_ICON_COUNT }, (_, id) => id).filter(
    (id) => id !== current,
  );
  return candidates[Math.floor(random() * candidates.length)] ?? 0;
}

type Failure =
  | RiotErrorKind
  /** Le compte n'existe pas ou n'appartient pas à l'utilisateur. */
  | "account_missing"
  /** Riot ne connaît pas ce Riot ID sur ce serveur. */
  | "player_unknown"
  /** Ce joueur est déjà lié sous un autre Riot ID. */
  | "player_already_linked";

export type ChallengeResult =
  | { ok: true; status: "pending"; iconId: number; expiresAt: Date }
  | { ok: true; status: "owned" }
  | { ok: false; reason: Failure };

type Deps = { api: RiotApi; now?: () => Date; random?: () => number };

/**
 * Demande la preuve : l'icône à mettre et jusqu'à quand. Une demande encore
 * valide est reprise telle quelle, pour que le joueur ne voie pas l'icône
 * changer s'il revient sur la page ; une demande expirée garde la même icône
 * (il l'a peut-être déjà mise). Si Riot montre déjà l'icône demandée, le
 * compte est confirmé tout de suite.
 */
export async function startOwnershipChallenge(
  userId: string,
  accountId: string,
  { api, now = () => new Date(), random = Math.random }: Deps,
): Promise<ChallengeResult> {
  const account = await findRiotAccount(userId, accountId);
  if (!account) return { ok: false, reason: "account_missing" };
  if (account.ownedAt) return { ok: true, status: "owned" };

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

    const current = now();
    const asked = account.ownershipIconId;
    const deadline = account.ownershipExpiresAt;
    if (asked !== null && deadline) {
      if (asked === summoner.profileIconId && current <= graceEnd(deadline)) {
        await markRiotAccountOwned(userId, accountId, current);
        return { ok: true, status: "owned" };
      }
      if (deadline > current) {
        return { ok: true, status: "pending", iconId: asked, expiresAt: deadline };
      }
    }

    const iconId =
      asked !== null && asked !== summoner.profileIconId
        ? asked
        : pickChallengeIcon(summoner.profileIconId, random);
    const expiresAt = new Date(current.getTime() + CHALLENGE_MINUTES * 60_000);
    await saveOwnershipChallenge(userId, accountId, { iconId, expiresAt });
    return { ok: true, status: "pending", iconId, expiresAt };
  } catch (error) {
    if (error instanceof RiotPlayerAlreadyLinkedError) {
      return { ok: false, reason: "player_already_linked" };
    }
    if (error instanceof RiotApiError) return { ok: false, reason: error.kind };
    throw error;
  }
}

export type ConfirmResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | RiotErrorKind
        | "account_missing"
        /** Aucune preuve demandée pour ce compte. */
        | "no_challenge"
        /** Le temps laissé est passé, et Riot ne montre pas l'icône : il faut recommencer. */
        | "expired";
    }
  /** Riot montre encore une autre icône sur ce compte : celle-ci. */
  | { ok: false; reason: "icon_mismatch"; seenIconId: number };

/** Vérifie auprès de Riot que l'icône demandée est sur le compte. */
export async function confirmOwnershipChallenge(
  userId: string,
  accountId: string,
  { api, now = () => new Date() }: Omit<Deps, "random">,
): Promise<ConfirmResult> {
  const account = await findRiotAccount(userId, accountId);
  if (!account) return { ok: false, reason: "account_missing" };
  if (account.ownedAt) return { ok: true };
  if (account.ownershipIconId === null || !account.ownershipExpiresAt || !account.puuid) {
    return { ok: false, reason: "no_challenge" };
  }
  const current = now();
  // Passé le délai, l'icône demandée vaut encore preuve un moment (Riot en retard).
  const late = account.ownershipExpiresAt <= current;
  if (late && current > graceEnd(account.ownershipExpiresAt)) {
    return { ok: false, reason: "expired" };
  }

  try {
    const summoner = await api.getSummoner(account.platform, account.puuid);
    await updateRiotAccountProfile(userId, accountId, {
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
    });
    if (summoner.profileIconId !== account.ownershipIconId) {
      return late
        ? { ok: false, reason: "expired" }
        : { ok: false, reason: "icon_mismatch", seenIconId: summoner.profileIconId };
    }
  } catch (error) {
    if (error instanceof RiotApiError) return { ok: false, reason: error.kind };
    throw error;
  }

  await markRiotAccountOwned(userId, accountId, current);
  return { ok: true };
}
