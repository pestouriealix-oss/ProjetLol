import "server-only";

import { env } from "@/lib/env";

/**
 * Envoi des e-mails (vérification de l'adresse, nouveau mot de passe) par
 * l'API de Resend. Sans clé, rien ne part : en développement, l'e-mail est
 * écrit dans le terminal pour pouvoir suivre le lien.
 */

export type Email = { to: string; subject: string; text: string; html: string };

export const isEmailConfigured = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);

export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailError";
  }
}

export async function sendEmail(email: Email): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (process.env.NODE_ENV === "production")
      throw new EmailError("Envoi d'e-mails non configuré");
    // Développement : le lien s'affiche dans le terminal du serveur.
    // eslint-disable-next-line no-console
    console.info(`\n[e-mail non envoyé] À ${email.to} : ${email.subject}\n${email.text}\n`);
    return;
  }

  const response = await fetch(`${env.RESEND_API_BASE_URL ?? "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new EmailError(
      `Resend a refusé l'e-mail (${response.status}) : ${await response.text()}`,
    );
  }
}

/** Adresse absolue d'une page du site, pour les liens des e-mails. */
export function appUrl(path: string): string {
  const base =
    env.APP_URL ??
    (env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return new URL(path, base).toString();
}
