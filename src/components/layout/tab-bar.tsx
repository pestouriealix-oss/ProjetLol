"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";

import { isActive, TAB_ITEMS } from "./nav-items";

/**
 * Navigation du téléphone, en bas de l'écran : atteignable au pouce quand le
 * téléphone est posé à côté du clavier.
 */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={t.nav.main}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {TAB_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors duration-(--duration-fast)",
                  active ? "text-accent" : "text-ink-muted",
                )}
              >
                <Icon aria-hidden className="size-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
