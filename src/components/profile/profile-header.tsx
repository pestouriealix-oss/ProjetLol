import { Settings } from "lucide-react";

import { RoleGlyph } from "@/components/map/role-glyph";
import { AccountSwitcher } from "@/components/profile/account-switcher";
import { SyncButton } from "@/components/profile/sync-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { PLATFORMS, type Platform, type Role } from "@/lib/config";

const copy = t.dashboard;

export type ProfileAccount = {
  id: string;
  gameName: string;
  tagLine: string;
  platform: Platform;
  roles: Role[];
  verified: boolean;
};

/**
 * En-tête du tableau de bord : qui est affiché. Même logique que les pages de
 * profil des sites de statistiques : l'identité à gauche, la mise à jour et le
 * choix du compte à droite, et tout ce qui suit concerne ce compte-là.
 */
export function ProfileHeader({
  account,
  accounts,
  lastSynced,
}: {
  account: ProfileAccount;
  accounts: ProfileAccount[];
  /** « Mis à jour il y a 3 minutes », déjà mis en forme. */
  lastSynced: string;
}) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
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
              {account.verified ? null : <Badge tone="warn">{copy.unverified}</Badge>}
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <AccountSwitcher basePath="/dashboard" accounts={accounts} currentId={account.id} />
          <Button asChild variant="ghost" size="icon" aria-label={copy.manage} title={copy.manage}>
            <Link href="/settings">
              <Settings aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
      {/* La clé remet le message à zéro quand on change de compte. */}
      <SyncButton key={account.id} accountId={account.id} lastSynced={lastSynced} />
    </header>
  );
}
