import type { Metadata } from "next";

import { AuthPanel } from "@/components/auth/auth-panel";
import { AppLinkForm } from "@/components/companion/app-link-form";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { formatInviteCode, normalizeInviteCode } from "@/lib/auth/invite-code";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: t.companion.link.title };

const copy = t.companion.link;

type AppLinkPageProps = { searchParams: Promise<{ code?: string | string[] }> };

/**
 * Où l'app Overwolf envoie le joueur pour valider son code. Le code de
 * l'adresse ne fait que préremplir le champ : rien n'est relié sans un clic.
 */
export default async function AppLinkPage({ searchParams }: AppLinkPageProps) {
  const { code: raw } = await searchParams;
  const code = normalizeInviteCode((Array.isArray(raw) ? raw[0] : raw) ?? "");
  const user = await getCurrentUser();

  if (!user) {
    const next = code ? `/app?code=${code}` : "/app";
    return (
      <AuthPanel title={copy.title}>
        <p className="text-ink-muted">{copy.intro}</p>
        <p className="text-ink-muted">{copy.loginFirst}</p>
        <Button asChild size="lg">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>{copy.loginAction}</Link>
        </Button>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel title={copy.title}>
      <p className="text-ink-muted">{copy.intro}</p>
      <AppLinkForm
        initialCode={code ? formatInviteCode(code) : ""}
        signedInAs={copy.as(user.name ?? user.email)}
      />
    </AuthPanel>
  );
}
