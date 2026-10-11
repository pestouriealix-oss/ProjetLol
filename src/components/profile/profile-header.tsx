import { Settings } from "lucide-react";

import { RoleGlyph } from "@/components/map/role-glyph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { PLATFORMS, type Platform, type Role } from "@/lib/config";
import { cn } from "@/lib/cn";

const copy = t.dashboard;

export type ProfileAccount = {
  id: string;
  gameName: string;
  tagLine: string;
  platform: Platform;
  roles: Role[];
};

/**
 * En-tête du tableau de bord : qui est affiché. Même logique que les pages de
 * profil des sites de statistiques : l'identité à gauche, le choix du compte et
 * les réglages à droite, et tout ce qui suit concerne ce compte-là.
 */
export function ProfileHeader({
  account,
  accounts,
}: {
  account: ProfileAccount;
  accounts: ProfileAccount[];
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-5">
      <div className="flex min-w-0 items-center gap-4 sm:gap-5">
        <div
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-panel border border-line-strong bg-raised display text-3xl text-ink sm:size-18 sm:text-4xl"
        >
          {account.gameName.trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="display text-base tracking-[0.06em] text-ink-muted">{copy.title}</p>
          <h1 className="display-name text-3xl break-words text-ink sm:text-4xl">
            {account.gameName}
            <span className="text-ink-faint">#{account.tagLine}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <Badge>{PLATFORMS[account.platform].short}</Badge>
            {account.roles.length > 0 ? (
              account.roles.map((role) => (
                <Badge key={role} tone="accent">
                  <RoleGlyph role={role} className="size-3.5" />
                  {t.roles[role]}
                </Badge>
              ))
            ) : (
              <Badge>{copy.noRoles}</Badge>
            )}
            <Badge tone="warn">{copy.syncSoon}</Badge>
          </div>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {accounts.length > 1 ? (
          <nav aria-label={copy.accounts} className="flex rounded-control bg-field p-1">
            {accounts.map((candidate) => {
              const current = candidate.id === account.id;
              return (
                <Link
                  key={candidate.id}
                  href={`/dashboard?compte=${candidate.id}`}
                  aria-current={current ? "true" : undefined}
                  scroll={false}
                  className={cn(
                    "max-w-40 truncate rounded-[5px] px-3 display-name text-lg leading-8 transition-colors duration-(--duration-fast) ease-(--ease-out)",
                    current ? "bg-raised text-ink shadow-key" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {candidate.gameName}
                </Link>
              );
            })}
          </nav>
        ) : null}
        <Button asChild variant="ghost" size="icon" aria-label={copy.manage} title={copy.manage}>
          <Link href="/settings">
            <Settings aria-hidden />
          </Link>
        </Button>
      </div>
    </header>
  );
}
