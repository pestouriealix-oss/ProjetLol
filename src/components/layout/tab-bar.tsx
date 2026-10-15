"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";

import { isActive, TAB_ITEMS } from "./nav-items";

/**
 * Navigation du téléphone, en bas de l'écran : atteignable au pouce quand le
 * téléphone est posé à côté du clavier. Le repère glisse d'un onglet à l'autre.
 */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={t.nav.main}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TAB_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="relative">
              {active ? (
                <ViewTransition
                  name="tab-indicator"
                  share="nav-indicator"
                  enter="indicator-enter"
                  exit="indicator-exit"
                  default="none"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-[28%] top-0 h-[3px] -skew-x-[30deg] bg-accent"
                  />
                </ViewTransition>
              ) : null}
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-15 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors duration-(--duration-fast) ease-(--ease-out)",
                  active ? "text-accent" : "text-ink-muted",
                )}
              >
                <Icon
                  aria-hidden
                  className="size-5 transition-[scale,translate] duration-(--duration-slow) ease-(--ease-spring-bouncy) group-active:scale-90 group-aria-[current=page]:-translate-y-0.5"
                />
                {item.shortLabel ? (
                  <>
                    <span aria-hidden>{item.shortLabel}</span>
                    <span className="sr-only">{item.label}</span>
                  </>
                ) : (
                  <span>{item.label}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
