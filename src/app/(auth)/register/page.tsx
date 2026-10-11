import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel, authLinkClasses } from "@/components/auth/auth-panel";
import { DiscordButton } from "@/components/auth/discord-button";
import { RegisterForm } from "@/components/auth/register-form";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { getCurrentUser } from "@/lib/auth/session";
import { isDiscordEnabled } from "@/lib/env";

export const metadata: Metadata = { title: t.auth.registerTitle };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <AuthPanel title={t.auth.registerTitle}>
      <RegisterForm />
      {isDiscordEnabled ? <DiscordButton /> : null}
      <p className="text-ink-muted">
        {t.auth.hasAccount}{" "}
        <Link href="/login" className={authLinkClasses}>
          {t.auth.goToLogin}
        </Link>
      </p>
    </AuthPanel>
  );
}
