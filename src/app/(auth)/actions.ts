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

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
  /** Valeurs à remettre dans le formulaire après une erreur (jamais le mot de passe). */
  values?: { name?: string; email?: string };
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = { email: text(formData, "email") };
  const parsed = loginSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return { error: t.auth.errors.invalidCredentials, values };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: AFTER_LOGIN });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? t.auth.errors.invalidCredentials
            : t.auth.errors.unknown,
        values,
      };
    }
    // `signIn` signale sa redirection par une exception : on la laisse passer.
    throw error;
  }
  return {};
}

export async function registerAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") };
  const password = text(formData, "password");
  const parsed = registerSchema.safeParse({ ...values, password });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      fieldErrors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
      values,
    };
  }

  try {
    await createUserWithPassword({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
    });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { fieldErrors: { email: t.auth.errors.emailTaken }, values };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: AFTER_REGISTER,
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: t.auth.errors.unknown, values };
    throw error;
  }
  return {};
}

export async function discordSignInAction(): Promise<void> {
  if (!isDiscordEnabled) return;
  await signIn("discord", { redirectTo: AFTER_LOGIN });
}
