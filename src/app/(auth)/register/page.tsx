import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel, authLinkClasses } from "@/components/auth/auth-panel";
import { DiscordButton } from "@/components/auth/discord-button";
import { InviteAccepted } from "@/components/auth/invite-accepted";
import { InviteGate } from "@/components/auth/invite-gate";
import { RegisterForm } from "@/components/auth/register-form";
import { Link } from "@/components/ui/link";
import { ErrorNotice } from "@/components/ui/notice";
import { t } from "@/i18n/fr";
import { formatInviteCode, normalizeInviteCode } from "@/lib/auth/invite-code";
import { getCurrentUser } from "@/lib/auth/session";
import { isInviteUsable } from "@/lib/db/invites";
import { isDiscordEnabled, isInviteOnly } from "@/lib/env";

export const metadata: Metadata = { title: t.auth.registerTitle };

type Param = string | string[] | undefined;
type RegisterPageProps = {
  searchParams: Promise<{ code?: Param; invitation?: Param; ref?: Param }>;
};

const first = (value: Param) => (Array.isArray(value) ? value[0] : value);
/** La source d'une inscription (`?ref=`) : quelques lettres, rien de plus. */
const cleanSource = (value: Param) => {
  const source = first(value)?.toLowerCase();
  return source && /^[a-z0-9_-]{1,40}$/.test(source) ? source : undefined;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  if (await getCurrentUser()) redirect("/dashboard");

  const footer = (
    <p className="text-ink-muted">
      {t.auth.hasAccount}{" "}
      <Link href="/login" className={authLinkClasses}>
        {t.auth.goToLogin}
      </Link>
    </p>
  );

  // `?code=` : un code saisi ou reçu par e-mail (obligatoire pendant le test
  // fermé, facultatif ensuite : il fait du compte un fondateur). `?invitation=` :
  // retour d'une inscription Discord refusée (sans code, ou code épuisé).
  const params = await searchParams;
  const typed = first(params.code)?.trim() ?? "";
  const code = normalizeInviteCode(typed);
  const accepted = code ? await isInviteUsable(code) : false;

  if ((code && accepted) || !isInviteOnly) {
    const inviteCode = code && accepted ? code : undefined;
    return (
      <AuthPanel title={t.auth.registerTitle}>
        {inviteCode ? <InviteAccepted code={formatInviteCode(inviteCode)} /> : null}
        <RegisterForm inviteCode={inviteCode} />
        {isDiscordEnabled ? <DiscordButton signUp={{ inviteCode }} /> : null}
        {footer}
      </AuthPanel>
    );
  }

  const invitation = first(params.invitation);
  return (
    <AuthPanel title={t.auth.invite.closedTitle}>
      {invitation === "requise" ? <ErrorNotice>{t.auth.invite.required}</ErrorNotice> : null}
      <InviteGate
        code={typed || undefined}
        codeError={typed || invitation === "invalide" ? t.auth.invite.invalid : undefined}
        source={cleanSource(params.ref)}
      />
      {footer}
    </AuthPanel>
  );
}
