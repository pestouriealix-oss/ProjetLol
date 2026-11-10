import { formatInviteCode } from "@/lib/auth/invite-code";
import { appJson, appPreflight } from "@/lib/companion/http";
import { attemptKey, isRateLimited, recordAttempt } from "@/lib/db/auth-attempts";
import { createAppLinkRequest, LINK_TTL_MINUTES } from "@/lib/db/app-links";
import { appUrl } from "@/lib/email";

/** Demandes de liaison par adresse IP et par heure. */
const PER_IP = { max: 20, windowSeconds: 60 * 60 };

const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";

export const OPTIONS = appPreflight;

/**
 * L'app Overwolf commence une liaison : elle reçoit un secret à garder et un
 * code à montrer, que le joueur valide sur `/app`. Pas de compte à ce stade.
 */
export async function POST(request: Request) {
  const key = attemptKey("app-link-ip", clientIp(request));
  if (await isRateLimited(key, PER_IP.max)) return appJson(429, { error: "rate_limited" });
  await recordAttempt(key, PER_IP.windowSeconds);

  const { deviceCode, userCode } = await createAppLinkRequest();
  const code = formatInviteCode(userCode);
  return appJson(200, {
    deviceCode,
    userCode: code,
    verifyUrl: appUrl(`/app?code=${userCode}`),
    expiresIn: LINK_TTL_MINUTES * 60,
    /** Secondes entre deux questions de l'app. */
    interval: 3,
  });
}
