"use server";

import { AuthError } from "next-auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { t } from "@/i18n/fr";
import { signIn } from "@/lib/auth";
import {
  confirmEmail,
  resetPassword,
  sendPasswordReset,
  sendVerificationEmail,
} from "@/lib/auth/email-flows";
import { INVITE_COOKIE, INVITE_COOKIE_SECONDS } from "@/lib/auth/invite-cookie";
import { normalizeInviteCode } from "@/lib/auth/invite-code";
import { hashPassword } from "@/lib/auth/password";
import { safeNext } from "@/lib/auth/safe-next";
import { attemptKey, clearAttempts, isRateLimited, recordAttempt } from "@/lib/db/auth-attempts";
import { consumeInvite, isInviteUsable, joinWaitlist, releaseInvite } from "@/lib/db/invites";
import { createUserWithPassword, EmailTakenError } from "@/lib/db/users";
import { isDiscordEnabled, isInviteOnly } from "@/lib/env";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  waitlistSchema,
} from "@/lib/validation/auth";

const AFTER_LOGIN = "/dashboard";
/** Un nouveau compte arrive directement là où lier son compte Riot. */
const AFTER_REGISTER = "/settings";

export type AuthField = "name" | "email" | "password";

export type AuthFormState = {
  /** Nombre d'envois refusés : sert à rejouer le signe de refus et à replacer le focus. */
  attempt: number;
  error?: string;
  fieldErrors?: Partial<Record<AuthField, string>>;
  /** Valeurs à remettre dans le formulaire après une erreur (jamais le mot de passe). */
  values?: { name?: string; email?: string };
};

/**
 * Limites d'essais. Une connexion ratée compte pour l'e-mail visé et pour
 * l'adresse IP ; une inscription réussie compte pour l'adresse IP.
 */
const LIMITS = {
  loginPerEmail: { max: 5, windowSeconds: 15 * 60 },
  loginPerIp: { max: 30, windowSeconds: 15 * 60 },
  registerPerIp: { max: 10, windowSeconds: 60 * 60 },
  forgotPerEmail: { max: 3, windowSeconds: 60 * 60 },
  forgotPerIp: { max: 10, windowSeconds: 60 * 60 },
  waitlistPerIp: { max: 10, windowSeconds: 60 * 60 },
} as const;

/** Adresse du visiteur, telle que transmise par l'hébergeur (première de la liste). */
async function clientIp(): Promise<string> {
  const list = (await headers()).get("x-forwarded-for") ?? "";
  return list.split(",")[0]?.trim() || "inconnue";
}

/**
 * Les compteurs protègent sans jamais bloquer à tort : si la base ne répond
 * pas, l'essai passe (et l'erreur est journalisée).
 */
async function safely<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error("Compteur d'essais indisponible :", error);
    return fallback;
  }
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(
  previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = { email: text(formData, "email") };
  const refuse = (error: string): AuthFormState => ({
    attempt: previous.attempt + 1,
    error,
    values,
  });

  const parsed = loginSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return refuse(t.auth.errors.invalidCredentials);

  const emailKey = attemptKey("login", parsed.data.email);
  const ipKey = attemptKey("login-ip", await clientIp());
  const blocked = await safely(
    async () =>
      (await isRateLimited(emailKey, LIMITS.loginPerEmail.max)) ||
      (await isRateLimited(ipKey, LIMITS.loginPerIp.max)),
    false,
  );
  if (blocked) return refuse(t.auth.errors.tooManyAttempts);

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeNext(text(formData, "next")) ?? AFTER_LOGIN,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        await safely(async () => {
          await recordAttempt(emailKey, LIMITS.loginPerEmail.windowSeconds);
          await recordAttempt(ipKey, LIMITS.loginPerIp.windowSeconds);
        }, undefined);
        return refuse(t.auth.errors.invalidCredentials);
      }
      return refuse(t.auth.errors.unknown);
    }
    // `signIn` signale sa redirection par une exception : la connexion a
    // réussi, on remet le compteur de l'e-mail à zéro et on laisse passer.
    await safely(() => clearAttempts(emailKey), undefined);
    throw error;
  }
  return previous;
}

export async function registerAction(
  previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") };
  const refuse = (rest: Pick<AuthFormState, "error" | "fieldErrors">): AuthFormState => ({
    attempt: previous.attempt + 1,
    values,
    ...rest,
  });

  const parsed = registerSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return refuse({
      fieldErrors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    });
  }

  const registerKey = attemptKey("register-ip", await clientIp());
  const blocked = await safely(() => isRateLimited(registerKey, LIMITS.registerPerIp.max), false);
  if (blocked) return refuse({ error: t.auth.errors.tooManyAttempts });

  // Un code d'invitation (obligatoire pendant le test fermé, facultatif
  // ensuite : il fait de son compte un « fondateur ») : une place est prise
  // avant de créer le compte, et rendue si la création échoue.
  const code = normalizeInviteCode(text(formData, "code"));
  const inviteId = code ? await consumeInvite(code) : null;
  if (isInviteOnly && !inviteId) return refuse({ error: t.auth.invite.invalid });

  try {
    const user = await createUserWithPassword({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      inviteId,
    });
    // Le lien de confirmation part tout de suite ; s'il échoue, le bandeau de
    // l'application permet de le renvoyer : l'inscription ne doit pas en dépendre.
    await safely(() => sendVerificationEmail(user), undefined);
  } catch (error) {
    if (inviteId) await safely(() => releaseInvite(inviteId), undefined);
    if (error instanceof EmailTakenError) {
      return refuse({ fieldErrors: { email: t.auth.errors.emailTaken } });
    }
    // Base de données injoignable ou autre panne : un message clair plutôt
    // qu'un écran d'erreur, et la cause complète dans les journaux du serveur.
    console.error("Inscription impossible :", error);
    return refuse({ error: t.auth.errors.unavailable });
  }
  await safely(() => recordAttempt(registerKey, LIMITS.registerPerIp.windowSeconds), undefined);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: AFTER_REGISTER,
    });
  } catch (error) {
    if (error instanceof AuthError) return refuse({ error: t.auth.errors.unknown });
    throw error;
  }
  return previous;
}

export async function discordSignInAction(formData: FormData): Promise<void> {
  if (!isDiscordEnabled) return;
  await signIn("discord", { redirectTo: safeNext(text(formData, "next")) ?? AFTER_LOGIN });
}

/**
 * Inscription via Discord. Un code d'invitation (obligatoire pendant le test
 * fermé) est vérifié, puis gardé dans un cookie le temps de l'aller-retour
 * chez Discord : la place est prise au retour (voir `src/lib/auth`).
 */
export async function discordSignUpAction(formData: FormData): Promise<void> {
  if (!isDiscordEnabled) return;
  const code = normalizeInviteCode(text(formData, "code"));
  const usable = code ? await isInviteUsable(code) : false;
  if (isInviteOnly && !usable) redirect("/register?invitation=invalide");
  if (code && usable) {
    (await cookies()).set(INVITE_COOKIE, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: INVITE_COOKIE_SECONDS,
    });
  }
  await signIn("discord", { redirectTo: AFTER_REGISTER });
}

export type WaitlistState = {
  attempt: number;
  status?: "added" | "already";
  error?: string;
  email?: string;
};

/** Liste d'attente : une adresse et son consentement, rien d'autre. */
export async function joinWaitlistAction(
  previous: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const email = text(formData, "email");
  const refuse = (error: string): WaitlistState => ({
    attempt: previous.attempt + 1,
    error,
    email,
  });

  const parsed = waitlistSchema.safeParse({
    email,
    consent: formData.get("consent"),
    source: text(formData, "source") || null,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return refuse(
      issue?.path[0] === "consent" ? t.auth.invite.consentRequired : t.auth.errors.emailInvalid,
    );
  }

  const ipKey = attemptKey("waitlist-ip", await clientIp());
  if (await safely(() => isRateLimited(ipKey, LIMITS.waitlistPerIp.max), false)) {
    return refuse(t.auth.errors.tooManyAttempts);
  }
  try {
    const status = await joinWaitlist(parsed.data.email, parsed.data.source);
    await safely(() => recordAttempt(ipKey, LIMITS.waitlistPerIp.windowSeconds), undefined);
    return { attempt: previous.attempt, status };
  } catch (error) {
    console.error("Liste d'attente indisponible :", error);
    return refuse(t.auth.errors.unavailable);
  }
}

export type ForgotPasswordState = {
  attempt: number;
  sent?: boolean;
  error?: string;
  email?: string;
};

/**
 * Lien « nouveau mot de passe ». La réponse est la même que le compte existe
 * ou non : la page ne doit pas servir à vérifier qui est inscrit.
 */
export async function forgotPasswordAction(
  previous: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = text(formData, "email");
  const refuse = (error: string): ForgotPasswordState => ({
    attempt: previous.attempt + 1,
    error,
    email,
  });

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return refuse(t.auth.errors.emailInvalid);

  const emailKey = attemptKey("forgot", parsed.data.email);
  const ipKey = attemptKey("forgot-ip", await clientIp());
  const blocked = await safely(
    async () =>
      (await isRateLimited(emailKey, LIMITS.forgotPerEmail.max)) ||
      (await isRateLimited(ipKey, LIMITS.forgotPerIp.max)),
    false,
  );
  if (blocked) return refuse(t.auth.errors.tooManyAttempts);
  await safely(async () => {
    await recordAttempt(emailKey, LIMITS.forgotPerEmail.windowSeconds);
    await recordAttempt(ipKey, LIMITS.forgotPerIp.windowSeconds);
  }, undefined);

  try {
    await sendPasswordReset(parsed.data.email);
  } catch (error) {
    console.error("Lien de mot de passe impossible :", error);
    return refuse(t.auth.errors.unavailable);
  }
  return { attempt: previous.attempt + 1, sent: true, email };
}

export type ResetPasswordState = {
  attempt: number;
  error?: string;
  fieldError?: string;
  /** Le lien ne vaut plus : la page propose d'en demander un autre. */
  expired?: boolean;
};

export async function resetPasswordAction(
  previous: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: text(formData, "token"),
    password: text(formData, "password"),
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    if (fieldErrors.token) return { attempt: previous.attempt + 1, expired: true };
    return { attempt: previous.attempt + 1, fieldError: fieldErrors.password?.[0] };
  }

  let changed: boolean;
  try {
    changed = await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    console.error("Changement de mot de passe impossible :", error);
    return { attempt: previous.attempt + 1, error: t.auth.errors.unavailable };
  }
  if (!changed) return { attempt: previous.attempt + 1, expired: true };
  redirect("/login?reset=done");
}

export type ConfirmEmailState = { status: "idle" | "done" | "invalid" | "error" };

export async function confirmEmailAction(
  _previous: ConfirmEmailState,
  formData: FormData,
): Promise<ConfirmEmailState> {
  try {
    return { status: (await confirmEmail(text(formData, "token"))) ? "done" : "invalid" };
  } catch (error) {
    console.error("Confirmation d'adresse impossible :", error);
    return { status: "error" };
  }
}
