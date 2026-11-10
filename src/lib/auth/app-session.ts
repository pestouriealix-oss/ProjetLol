import "server-only";

import { findAppToken } from "@/lib/db/app-links";
import { findSessionUser, type CurrentUser } from "@/lib/db/users";

/** Un jeton d'app : 32 octets en base64url. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * L'utilisateur d'une requête de l'app Overwolf (`Authorization: Bearer …`),
 * relu en base à chaque appel comme pour le site. Un jeton créé avant le
 * dernier changement de mot de passe ne vaut plus.
 *
 * À appeler en tête de chaque route `/api/app/*` protégée, comme
 * `requireUser()` pour le site ; `null` → répondre 401.
 */
export async function requireAppUser(
  request: Request,
): Promise<{ user: CurrentUser; tokenId: string } | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!TOKEN_PATTERN.test(token)) return null;

  const found = await findAppToken(token);
  if (!found) return null;
  const session = await findSessionUser(found.userId);
  if (!session) return null;
  if (session.passwordChangedAt && found.createdAt < session.passwordChangedAt) return null;
  return { user: session.user, tokenId: found.id };
}
