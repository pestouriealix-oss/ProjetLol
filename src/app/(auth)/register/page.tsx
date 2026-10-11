import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DiscordButton } from "@/components/auth/discord-button";
import { RegisterForm } from "@/components/auth/register-form";
import { t } from "@/i18n/fr";
import { getCurrentUser } from "@/lib/auth/session";
import { isDiscordEnabled } from "@/lib/env";

export const metadata: Metadata = { title: t.auth.registerTitle };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t.auth.registerTitle}</h1>
      <RegisterForm />
      {isDiscordEnabled ? <DiscordButton /> : null}
      <p className="text-sm text-ink-muted">
        {t.auth.hasAccount}{" "}
        <Link
          href="/login"
          className="font-medium text-ink underline underline-offset-4 hover:text-accent"
        >
          {t.auth.goToLogin}
        </Link>
      </p>
    </div>
  );
}
