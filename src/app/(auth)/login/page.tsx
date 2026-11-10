import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel, authLinkClasses } from "@/components/auth/auth-panel";
import { DiscordButton } from "@/components/auth/discord-button";
import { LoginForm } from "@/components/auth/login-form";
import { Link } from "@/components/ui/link";
import { SuccessNotice } from "@/components/ui/notice";
import { t } from "@/i18n/fr";
import { safeNext } from "@/lib/auth/safe-next";
import { getCurrentUser } from "@/lib/auth/session";
import { isDiscordEnabled, isInviteOnly } from "@/lib/env";

export const metadata: Metadata = { title: t.auth.loginTitle };

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    reset?: string | string[];
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Auth.js renvoie ici avec `?error=…` quand la connexion Discord échoue.
  // `?reset=done` : retour après le choix d'un nouveau mot de passe. `?next=` :
  // la page où revenir (la liaison de l'app Overwolf, par exemple).
  const { error, reset, next: rawNext } = await searchParams;
  const next = safeNext(Array.isArray(rawNext) ? rawNext[0] : rawNext) ?? undefined;
  if (await getCurrentUser()) redirect(next ?? "/dashboard");

  return (
    <AuthPanel title={t.auth.loginTitle}>
      {reset === "done" ? <SuccessNotice>{t.auth.reset.done}</SuccessNotice> : null}
      <LoginForm initialError={error ? t.auth.errors.oauth : undefined} next={next} />
      <p className="-mt-2">
        <Link
          href="/forgot-password"
          className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {t.auth.forgotLink}
        </Link>
      </p>
      {isDiscordEnabled ? <DiscordButton next={next} /> : null}
      <p className="text-ink-muted">
        {t.auth.noAccount}{" "}
        <Link href="/register" className={authLinkClasses}>
          {isInviteOnly ? t.auth.goToInvite : t.auth.goToRegister}
        </Link>
      </p>
    </AuthPanel>
  );
}
