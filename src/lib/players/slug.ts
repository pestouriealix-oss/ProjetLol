import { PLATFORMS, PLATFORM_IDS, type Platform } from "@/lib/config";
import { parseRiotId, type RiotId } from "@/lib/validation/riot";

/**
 * Adresse du profil d'un joueur : `/joueur/euw/Pseudo-TAG`. Le serveur s'écrit
 * comme dans le jeu (« euw », « kr »…) ; le tag, fait de lettres et de
 * chiffres, suit le dernier tiret (le pseudo peut en contenir).
 */

const BY_SHORT = new Map<string, Platform>(
  PLATFORM_IDS.map((platform) => [PLATFORMS[platform].short.toLowerCase(), platform]),
);

export function playerPath(platform: Platform, { gameName, tagLine }: RiotId): string {
  const server = PLATFORMS[platform].short.toLowerCase();
  return `/joueur/${server}/${encodeURIComponent(`${gameName}-${tagLine}`)}`;
}

/** Le serveur et le Riot ID d'une adresse de profil, ou `null` s'ils ne tiennent pas debout. */
export function parsePlayerPath(
  serverParam: string,
  riotIdParam: string,
): { platform: Platform; riotId: RiotId } | null {
  const platform = platformFromServer(serverParam);
  if (!platform) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(riotIdParam);
  } catch {
    return null;
  }
  const at = decoded.lastIndexOf("-");
  if (at < 1) return null;
  const parsed = parseRiotId(`${decoded.slice(0, at)}#${decoded.slice(at + 1)}`);
  return parsed.ok ? { platform, riotId: parsed.value } : null;
}

/** Le serveur d'un paramètre d'adresse (« euw », « KR »), ou `null`. */
export function platformFromServer(server: string | undefined): Platform | null {
  return server ? (BY_SHORT.get(server.toLowerCase()) ?? null) : null;
}

/**
 * L'adresse du profil écrite comme Riot écrit le Riot ID (« faker-kr1 » →
 * « Faker-KR1 »), ou `null` si l'adresse demandée l'écrit déjà ainsi.
 */
export function canonicalPlayerPath(
  requested: { platform: Platform; riotId: RiotId },
  actual: RiotId,
): string | null {
  const path = playerPath(requested.platform, actual);
  const [, , server = "", slug = ""] = path.split("/");
  const parsed = parsePlayerPath(server, slug);
  if (!parsed) return null;
  const same =
    parsed.riotId.gameName === requested.riotId.gameName &&
    parsed.riotId.tagLine === requested.riotId.tagLine;
  return same ? null : path;
}

/** Même Riot ID, majuscules mises à part (Riot n'en tient pas compte). */
export function isSameRiotId(a: RiotId, b: RiotId): boolean {
  return (
    a.gameName.toLowerCase() === b.gameName.toLowerCase() &&
    a.tagLine.toLowerCase() === b.tagLine.toLowerCase()
  );
}
