import { LayoutDashboard } from "lucide-react";

import { ChampionBackdrop } from "@/components/champion/champion-backdrop";
import { RoleGlyph } from "@/components/map/role-glyph";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { PLATFORMS, type Platform, type Role } from "@/lib/config";
import type { RiotId } from "@/lib/validation/riot";

const copy = t.player;

/** Postes affichés en badge : les deux plus joués sur les parties lues. */
const SHOWN_ROLES = 2;

/**
 * En-tête du profil d'un joueur : la même identité que le tableau de bord
 * (icône, niveau, Riot ID, serveur, postes), sans rien de ce qui sert à gérer
 * un compte. Derrière, l'art de son champion le plus joué.
 */
export function PlayerHeader({
  riotId,
  platform,
  iconUrl,
  level,
  roles,
  backdrop,
  loadedAt,
  ownAccountId,
}: {
  riotId: RiotId;
  platform: Platform;
  iconUrl: string | null;
  level: number;
  roles: { role: Role; games: number }[];
  backdrop: string | null;
  /** « Données Riot, lues il y a 2 minutes », déjà mis en forme. */
  loadedAt: string;
  /** Le compte Gufo correspondant, si c'est l'un des siens. */
  ownAccountId: string | null;
}) {
  return (
    <header className="relative isolate flex flex-col gap-4 pt-4 pb-2 sm:pt-8 sm:pb-4">
      <ChampionBackdrop
        src={backdrop}
        className="-top-10 bottom-0 left-1/2 w-screen -translate-x-1/2 sm:-top-14"
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <ProfileAvatar gameName={riotId.gameName} iconUrl={iconUrl} level={level} />
          <div className="min-w-0">
            <p className="sr-only">{copy.title}</p>
            <h1 className="display-name text-4xl break-words text-ink sm:text-6xl">
              {riotId.gameName}
              <span className="text-ink-faint">#{riotId.tagLine}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <Badge>{PLATFORMS[platform].short}</Badge>
              {roles.slice(0, SHOWN_ROLES).map(({ role }) => (
                <Badge key={role} tone="strong">
                  <RoleGlyph role={role} className="size-3.5" />
                  {t.roles[role]}
                </Badge>
              ))}
              {ownAccountId ? <Badge tone="strong">{copy.yours}</Badge> : null}
            </div>
          </div>
        </div>
        {ownAccountId ? (
          <div className="ml-auto">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/dashboard?compte=${ownAccountId}`}>
                <LayoutDashboard aria-hidden />
                {copy.toDashboard}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
      <p className="text-sm text-ink-faint">{loadedAt}</p>
    </header>
  );
}
