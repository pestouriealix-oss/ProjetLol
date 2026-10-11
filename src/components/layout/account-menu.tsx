"use client";

import { LogOut, Settings } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useTransition } from "react";

import { Link } from "@/components/ui/link";
import { Ping } from "@/components/ui/ping";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";

const itemClasses =
  "flex cursor-default items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-sm text-ink outline-none data-highlighted:bg-raised [&_svg]:size-4 [&_svg]:text-ink-muted";

type AccountMenuProps = {
  email: string;
  name: string | null;
  signOutAction: () => Promise<void>;
};

export function AccountMenu({ email, name, signOutAction }: AccountMenuProps) {
  const [pending, startTransition] = useTransition();
  const initial = (name ?? email).trim().charAt(0).toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t.nav.accountMenu}
        aria-busy={pending || undefined}
        className={cn(
          "flex size-9 items-center justify-center rounded-pill border border-line-strong bg-raised display text-lg text-ink",
          "[transition:scale_var(--duration-slow)_var(--ease-spring),border-color_var(--duration-fast)_var(--ease-out)]",
          "hover:border-ink-faint active:scale-[0.94] active:[transition-duration:var(--duration-press)] data-[state=open]:border-accent",
        )}
      >
        {pending ? <Ping className="text-accent" /> : initial}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-40 min-w-56 origin-(--radix-dropdown-menu-content-transform-origin) rounded-panel border border-line-strong bg-surface p-1.5 shadow-lift data-[state=closed]:animate-menu-out data-[state=open]:animate-menu-in"
        >
          <div className="px-2.5 py-2">
            {name ? <p className="display-name text-xl text-ink">{name}</p> : null}
            <p className="truncate text-sm text-ink-muted">{email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild className={itemClasses}>
            <Link href="/settings">
              <Settings aria-hidden />
              {t.nav.settings}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={itemClasses}
            onSelect={() => startTransition(() => signOutAction())}
          >
            <LogOut aria-hidden />
            {t.nav.signOut}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
