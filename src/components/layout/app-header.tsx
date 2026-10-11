import { Wordmark } from "@/components/brand/wordmark";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import type { CurrentUser } from "@/lib/db/users";

import { AccountMenu } from "./account-menu";
import { HeaderNav } from "./header-nav";
import { NewGameLink } from "./new-game-link";

type AppHeaderProps = {
  user: CurrentUser;
  signOutAction: () => Promise<void>;
};

export function AppHeader({ user, signOutAction }: AppHeaderProps) {
  return (
    // Flou large : ce qui défile dessous devient une lueur, jamais des lettres fantômes.
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/88 backdrop-blur-xl">
      <div className="mx-auto flex h-15 max-w-6xl items-stretch gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center rounded-control pr-2">
          <Wordmark />
        </Link>
        <nav aria-label={t.nav.main} className="hidden md:block">
          <HeaderNav />
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <NewGameLink />
          <AccountMenu email={user.email} name={user.name} signOutAction={signOutAction} />
        </div>
      </div>
    </header>
  );
}
