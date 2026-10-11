import Link from "next/link";

import { Button } from "@/components/ui/button";
import { t } from "@/i18n/fr";
import type { CurrentUser } from "@/lib/db/users";

import { AccountMenu } from "./account-menu";
import { HeaderNav } from "./header-nav";
import { NEW_GAME } from "./nav-items";
import { Wordmark } from "./wordmark";

type AppHeaderProps = {
  user: CurrentUser;
  signOutAction: () => Promise<void>;
};

export function AppHeader({ user, signOutAction }: AppHeaderProps) {
  const NewGameIcon = NEW_GAME.icon;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Link href="/dashboard" className="rounded-control">
          <Wordmark />
        </Link>
        <nav aria-label={t.nav.main} className="hidden flex-1 md:block">
          <HeaderNav />
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href={NEW_GAME.href}>
              <NewGameIcon aria-hidden />
              {NEW_GAME.label}
            </Link>
          </Button>
          <AccountMenu email={user.email} name={user.name} signOutAction={signOutAction} />
        </div>
      </div>
    </header>
  );
}
