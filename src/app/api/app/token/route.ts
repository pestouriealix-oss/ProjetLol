import { requireAppUser } from "@/lib/auth/app-session";
import { appJson, appPreflight, appUnauthorized } from "@/lib/companion/http";
import { exchangeAppLinkRequest, revokeAppToken } from "@/lib/db/app-links";
import { appTokenRequestSchema } from "@/lib/validation/companion";

export const OPTIONS = appPreflight;

/**
 * L'app demande où en est sa liaison : `pending` tant que le code n'est pas
 * validé, `expired` après 10 minutes, ou son jeton, une seule fois.
 */
export async function POST(request: Request) {
  const parsed = appTokenRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return appJson(400, { error: "invalid_request" });

  const result = await exchangeAppLinkRequest(parsed.data.deviceCode);
  if (result.status === "approved") return appJson(200, result);
  return appJson(result.status === "pending" ? 202 : 410, result);
}

/** Déconnexion depuis l'app : son jeton cesse de valoir. */
export async function DELETE(request: Request) {
  const auth = await requireAppUser(request);
  if (!auth) return appUnauthorized();
  await revokeAppToken(auth.user.id, auth.tokenId);
  return appJson(200, { status: "revoked" });
}
