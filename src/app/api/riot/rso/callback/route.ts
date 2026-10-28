import { timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { limitsFor } from "@/lib/auth/entitlements";
import { requireUser } from "@/lib/auth/session";
import {
  linkVerifiedRiotAccount,
  RiotAccountLimitError,
  RiotIdTakenError,
} from "@/lib/db/riot-accounts";
import { rsoIdentity } from "@/lib/riot/rso";

import { RSO_STATE_COOKIE, rsoRedirectUri } from "../shared";

/** Résultats possibles, expliqués par la page Paramètres (`?riot=…`). */
type Outcome = "linked" | "state" | "denied" | "limit" | "taken" | "platform" | "unavailable";

const back = (outcome: Outcome): never => redirect(`/settings?riot=${outcome}`);

const sameToken = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

/** Retour de Riot Sign On : vérifie le jeton, récupère l'identité et lie le compte. */
export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const jar = await cookies();
  const expected = jar.get(RSO_STATE_COOKIE)?.value;
  jar.delete({ name: RSO_STATE_COOKIE, path: "/api/riot/rso" });

  const state = url.searchParams.get("state");
  if (!expected || !state || !sameToken(state, expected)) return back("state");
  const code = url.searchParams.get("code");
  if (!code) return back("denied");

  let identity: Awaited<ReturnType<typeof rsoIdentity>>;
  try {
    identity = await rsoIdentity(code, rsoRedirectUri(request));
  } catch (error) {
    console.error("Riot Sign On impossible", error);
    return back("unavailable");
  }
  if (!identity.platform) return back("platform");

  try {
    await linkVerifiedRiotAccount(
      user.id,
      { ...identity, platform: identity.platform },
      { maxAccounts: limitsFor(user.plan).riotAccounts },
    );
  } catch (error) {
    if (error instanceof RiotAccountLimitError) return back("limit");
    if (error instanceof RiotIdTakenError) return back("taken");
    throw error;
  }
  return back("linked");
}
