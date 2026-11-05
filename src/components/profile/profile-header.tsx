import { Radio, Settings } from "lucide-react";

import { ChampionBackdrop } from "@/components/champion/champion-backdrop";
import { RoleGlyph } from "@/components/map/role-glyph";
import { AccountSwitcher } from "@/components/profile/account-switcher";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
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
  /** Propriété prouvée : sinon, un badge mène aux paramètres pour la prouver. */
  owned: boolean;
  /** Icône d'invocateur (déjà résolue en adresse Data Dragon) et niveau, après une synchronisation. */
  iconUrl: string | null;
  level: number | null;
};

/**
 * En-tête du tableau de bord : qui est affiché. Même logique que les pages de
 * profil des sites de statistiques : l'identité à gauche, la mise à jour et le
 * choix du compte à droite, et tout ce qui suit concerne ce compte-là.
 *
 * Derrière, l'art du champion le plus joué, vu dans un cercle de vision.
 */
export function ProfileHeader({
  account,
  accounts,
  lastSynced,
  backdrop,
}: {
  account: ProfileAccount;
  accounts: ProfileAccount[];
  /** « Mis à jour il y a 3 minutes », déjà mis en forme. */
  lastSynced: string;
  /** Art du champion le plus joué (Data Dragon), ou `null`. */
  backdrop: string | null;
}) {
  return (
    <header className="relative isolate flex flex-col gap-6 pt-4 pb-2 sm:pt-8 sm:pb-4">
      <ChampionBackdrop
        src={backdrop}
        className="-top-10 bottom-0 left-1/2 w-screen -translate-x-1/2 sm:-top-14"
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <ProfileAvatar
            gameName={account.gameName}
            iconUrl={account.iconUrl}
            level={account.level}
          />
          <div className="min-w-0">
            {/* Le nom suffit à situer la page ; le titre reste pour les lecteurs d'écran. */}
            <p className="sr-only">{copy.title}</p>
            <h1 className="display-name text-4xl break-words text-ink sm:text-6xl">
              {account.gameName}
              <span className="text-ink-faint">#{account.tagLine}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <Badge>{PLATFORMS[account.platform].short}</Badge>
              {account.roles.length > 0 ? (
                account.roles.map((role) => (
                  <Badge key={role} tone="strong">
                    <RoleGlyph role={role} className="size-3.5" />
                    {t.roles[role]}
                  </Badge>
                ))
              ) : (
                <Badge>{copy.noRoles}</Badge>
              )}
              {account.owned ? null : (
                <Link href="/settings" className="rounded-pill">
                  <Badge tone="warn">{copy.unowned}</Badge>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <AccountSwitcher basePath="/dashboard" accounts={accounts} currentId={account.id} />
          <Button asChild variant="ghost" size="sm">
            <Link href={`/live?compte=${account.id}`}>
              <Radio aria-hidden />
              {t.live.open}
            </Link>
          </Button>
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
