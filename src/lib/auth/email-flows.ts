import "server-only";

import { consumeEmailToken, issueEmailToken } from "@/lib/db/email-tokens";
import { findUserById, findUserIdByEmail, markEmailVerified, setPassword } from "@/lib/db/users";
import { appUrl, isEmailConfigured, sendEmail } from "@/lib/email";
import { resetPasswordMessage, verifyEmailMessage } from "@/lib/email/templates";

import { hashPassword } from "./password";

/**
 * Le coach (fiches de draft, lecture de capture, bilans) coûte des appels au
 * modèle : il attend une adresse confirmée, pour qu'une adresse jetable ne
 * suffise pas à multiplier les comptes gratuits. Tant que l'envoi d'e-mails
 * n'est pas configuré, personne ne peut confirmer : rien n'est bloqué.
 */
export function canUseCoach(user: { emailVerified: boolean }): boolean {
  return user.emailVerified || !isEmailConfigured;
}

/** Vrai s'il faut demander à l'utilisateur de confirmer son adresse. */
export function needsEmailConfirmation(user: { emailVerified: boolean }): boolean {
  return !canUseCoach(user);
}

/** Envoie (ou renvoie) le lien de confirmation de l'adresse du compte. */
export async function sendVerificationEmail(user: {
  id: string;
  email: string;
  name: string | null;
}): Promise<void> {
  const token = await issueEmailToken(user.id, "VERIFY_EMAIL", user.email);
  const link = appUrl(`/verify-email?token=${encodeURIComponent(token)}`);
  await sendEmail(verifyEmailMessage(user.email, user.name, link));
}

/** Confirme l'adresse avec le lien reçu. Renvoie faux si le lien ne vaut rien. */
export async function confirmEmail(token: string): Promise<boolean> {
  const used = await consumeEmailToken("VERIFY_EMAIL", token);
  if (!used) return false;
  return markEmailVerified(used.userId, used.email);
}

/**
 * Envoie un lien « nouveau mot de passe » si un compte utilise cette adresse.
 * Ne dit jamais si le compte existe : l'appelant répond pareil dans les deux cas.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const userId = await findUserIdByEmail(email);
  if (!userId) return;
  const user = await findUserById(userId);
  if (!user) return;
  const token = await issueEmailToken(user.id, "RESET_PASSWORD", user.email);
  const link = appUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  await sendEmail(resetPasswordMessage(user.email, user.name, link));
}

/**
 * Change le mot de passe avec le lien reçu. Les autres sessions sont fermées.
 * Renvoie faux si le lien ne vaut rien (expiré, déjà utilisé, adresse changée).
 */
export async function resetPassword(token: string, password: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  const used = await consumeEmailToken("RESET_PASSWORD", token);
  if (!used) return false;
  await setPassword(used.userId, passwordHash);
  return true;
}
