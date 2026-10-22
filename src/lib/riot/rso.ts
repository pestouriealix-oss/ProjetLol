import "server-only";
import { z } from "zod";

import { PLATFORM_IDS, type Platform } from "@/lib/config";
import { env } from "@/lib/env";

/**
 * Riot Sign On : le joueur se connecte chez Riot, qui nous confirme son
 * identité (PUUID, Riot ID, serveur). Pas de mot de passe chez nous, et un
 * compte lié ainsi est vérifié d'office. Disponible seulement quand Riot a
 * accordé un client RSO (avec la clé de production).
 */

const AUTH_BASE_URL = "https://auth.riotgames.com";
/** Les données d'Account-V1 sont les mêmes partout : on interroge la grappe européenne. */
const ACCOUNT_BASE_URL = "https://europe.api.riotgames.com";
/** `cpid` : Riot renvoie le serveur actuel du joueur (« EUW1 »). */
const SCOPE = "openid cpid";

export const isRsoEnabled = (): boolean =>
  Boolean(env.RIOT_RSO_CLIENT_ID && env.RIOT_RSO_CLIENT_SECRET);

const authBase = () => env.RIOT_RSO_BASE_URL ?? AUTH_BASE_URL;
const accountBase = () => env.RIOT_RSO_BASE_URL ?? env.RIOT_API_BASE_URL ?? ACCOUNT_BASE_URL;

/** L'adresse où envoyer le joueur se connecter chez Riot. */
export function rsoAuthorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: env.RIOT_RSO_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    state,
  });
  return `${authBase()}/authorize?${params.toString()}`;
}

export class RsoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RsoError";
  }
}

const tokenSchema = z.object({ access_token: z.string().min(1) });
const userInfoSchema = z.object({ cpid: z.string().optional() });
const accountSchema = z.object({
  puuid: z.string().min(1),
  gameName: z.string().min(1),
  tagLine: z.string().min(1),
});

async function readJson<T>(response: Response, schema: z.ZodType<T>, what: string): Promise<T> {
  if (!response.ok) throw new RsoError(`${what} : Riot a répondu ${response.status}.`);
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new RsoError(`${what} : réponse inattendue de Riot.`);
  return parsed.data;
}

/**
 * Échange le code reçu au retour de Riot contre l'identité du joueur. Le
 * jeton d'accès sert uniquement ici ; il n'est jamais gardé.
 */
export async function rsoIdentity(
  code: string,
  redirectUri: string,
): Promise<{ puuid: string; gameName: string; tagLine: string; platform: Platform | null }> {
  if (!isRsoEnabled()) throw new RsoError("Riot Sign On n'est pas configuré.");
  const basic = Buffer.from(`${env.RIOT_RSO_CLIENT_ID}:${env.RIOT_RSO_CLIENT_SECRET}`).toString(
    "base64",
  );
  const token = await readJson(
    await fetch(`${authBase()}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
      cache: "no-store",
    }),
    tokenSchema,
    "Échange du code",
  );
  const bearer = { Authorization: `Bearer ${token.access_token}` };

  const [userInfo, account] = await Promise.all([
    fetch(`${authBase()}/userinfo`, { headers: bearer, cache: "no-store" }).then((response) =>
      readJson(response, userInfoSchema, "Profil Riot"),
    ),
    fetch(`${accountBase()}/riot/account/v1/accounts/me`, {
      headers: bearer,
      cache: "no-store",
    }).then((response) => readJson(response, accountSchema, "Compte Riot")),
  ]);

  const cpid = userInfo.cpid?.toUpperCase();
  const platform = PLATFORM_IDS.find((id) => id === cpid) ?? null;
  return { ...account, platform };
}
