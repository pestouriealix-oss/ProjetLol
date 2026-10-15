"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { t } from "@/i18n/fr";
import { signIn } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { createUserWithPassword, EmailTakenError } from "@/lib/db/users";
import { isDiscordEnabled } from "@/lib/env";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

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

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: AFTER_LOGIN });
  } catch (error) {
    if (error instanceof AuthError) {
      return refuse(
        error.type === "CredentialsSignin"
          ? t.auth.errors.invalidCredentials
          : t.auth.errors.unknown,
      );
    }
    // `signIn` signale sa redirection par une exception : on la laisse passer.
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

  try {
    await createUserWithPassword({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
    });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return refuse({ fieldErrors: { email: t.auth.errors.emailTaken } });
    }
    // Base de données injoignable ou autre panne : un message clair plutôt
    // qu'un écran d'erreur, et la cause complète dans les journaux du serveur.
    console.error("Inscription impossible :", error);
    return refuse({ error: t.auth.errors.unavailable });
  }

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

export async function discordSignInAction(): Promise<void> {
  if (!isDiscordEnabled) return;
  await signIn("discord", { redirectTo: AFTER_LOGIN });
}
