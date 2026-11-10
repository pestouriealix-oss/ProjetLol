"use server";

import { t } from "@/i18n/fr";
import { normalizeInviteCode } from "@/lib/auth/invite-code";
import { requireUser } from "@/lib/auth/session";
import { approveAppLinkRequest } from "@/lib/db/app-links";
import { attemptKey, isRateLimited, recordAttempt } from "@/lib/db/auth-attempts";

/** Essais de code par compte : assez pour une faute de frappe, pas pour deviner. */
const PER_USER = { max: 10, windowSeconds: 10 * 60 };

export type AppLinkState = {
  attempt: number;
  status?: "approved";
  error?: string;
  code?: string;
};

/** Le joueur connecté valide le code affiché dans l'app Overwolf. */
export async function approveAppLinkAction(
  previous: AppLinkState,
  formData: FormData,
): Promise<AppLinkState> {
  const user = await requireUser();
  const raw = formData.get("code");
  const typed = typeof raw === "string" ? raw : "";
  const refuse = (error: string): AppLinkState => ({
    attempt: previous.attempt + 1,
    error,
    code: typed,
  });

  const key = attemptKey("app-link-user", user.id);
  if (await isRateLimited(key, PER_USER.max)) return refuse(t.companion.link.tooMany);

  const code = normalizeInviteCode(typed);
  const approved = code ? await approveAppLinkRequest(user.id, code) : false;
  if (!approved) {
    await recordAttempt(key, PER_USER.windowSeconds);
    return refuse(t.companion.link.invalid);
  }
  return { attempt: previous.attempt, status: "approved" };
}
