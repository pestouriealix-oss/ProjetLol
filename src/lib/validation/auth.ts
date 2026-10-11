import { z } from "zod";

import { t } from "@/i18n/fr";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: t.auth.errors.emailInvalid }));

const password = z
  .string()
  .min(8, { error: t.auth.errors.passwordTooShort })
  .max(128, { error: t.auth.errors.passwordTooLong });

export const loginSchema = z.object({
  email,
  // À la connexion on ne révèle pas la politique de mot de passe.
  password: z.string().min(1).max(128),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .max(32, { error: t.auth.errors.nameTooLong })
    .transform((value) => (value === "" ? null : value)),
  email,
  password,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
