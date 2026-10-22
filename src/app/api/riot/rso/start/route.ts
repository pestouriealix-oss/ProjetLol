import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { isRsoEnabled, rsoAuthorizeUrl } from "@/lib/riot/rso";

import { RSO_STATE_COOKIE, rsoRedirectUri } from "../shared";

/** Envoie le joueur se connecter chez Riot ; il revient sur `/api/riot/rso/callback`. */
export async function GET(request: Request) {
  await requireUser();
  if (!isRsoEnabled()) redirect("/settings");

  // Jeton à usage unique : le retour de Riot doit le rapporter, sinon il est refusé.
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(RSO_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/api/riot/rso",
    maxAge: 10 * 60,
  });
  redirect(rsoAuthorizeUrl(state, rsoRedirectUri(request)));
}
