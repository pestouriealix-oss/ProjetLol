import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DiscordButton } from "@/components/auth/discord-button";
import { LoginForm } from "@/components/auth/login-form";
import { t } from "@/i18n/fr";
import { getCurrentUser } from "@/lib/auth/session";
import { isDiscordEnabled } from "@/lib/env";

export const metadata: Metadata = { title: t.auth.loginTitle };

type LoginPageProps = { searchParams: Promise<{ error?: string | string[] }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getCurrentUser()) redirect("/dashboard");

  // Auth.js renvoie ici avec `?error=…` quand la connexion Discord échoue.
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t.auth.loginTitle}</h1>
      <LoginForm initialError={error ? t.auth.errors.oauth : undefined} />
      {isDiscordEnabled ? <DiscordButton /> : null}
      <p className="text-sm text-ink-muted">
        {t.auth.noAccount}{" "}
        <Link
          href="/register"
          className="font-medium text-ink underline underline-offset-4 hover:text-accent"
        >
          {t.auth.goToRegister}
        </Link>
      </p>
    </div>
  );
}
