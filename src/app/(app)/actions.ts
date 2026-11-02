"use server";

import { signOut } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/auth/email-flows";
import { requireUser } from "@/lib/auth/session";
import { attemptKey, isRateLimited, recordAttempt } from "@/lib/db/auth-attempts";

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

/** Renvois du lien de confirmation par utilisateur et par heure. */
const RESENDS_PER_HOUR = { max: 3, windowSeconds: 3600 };

export type ResendVerificationResult = "sent" | "too_many" | "failed" | "already";

/** Renvoie le lien de confirmation de l'adresse (bandeau de l'application). */
export async function resendVerificationAction(): Promise<ResendVerificationResult> {
  const user = await requireUser();
  if (user.emailVerified) return "already";

  const key = attemptKey("verify-resend", user.id);
  if (await isRateLimited(key, RESENDS_PER_HOUR.max)) return "too_many";
  await recordAttempt(key, RESENDS_PER_HOUR.windowSeconds);

  try {
    await sendVerificationEmail(user);
    return "sent";
  } catch (error) {
    console.error("Renvoi du lien de confirmation impossible :", error);
    return "failed";
  }
}
