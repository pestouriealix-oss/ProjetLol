"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

import { Link } from "@/components/ui/link";
import { cn } from "@/lib/cn";

import { HEADER_ITEMS, isActive } from "./nav-items";

/**
 * Liens de l'en-tête. Le repère corail n'existe qu'une fois : en changeant de
 * page il glisse d'un lien à l'autre (élément partagé d'une transition de vue)
 * au lieu de disparaître ici pour réapparaître là.
 */
export function HeaderNav() {
  const pathname = usePathname();
  return (
    <ul className="flex h-full items-stretch">
      {HEADER_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href} className="relative flex">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center px-2.5 display text-lg tracking-[0.045em] whitespace-nowrap transition-colors duration-(--duration-fast) ease-(--ease-out) lg:px-3.5",
                active ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {/* Six liens sur une tablette : le libellé court tant que la place manque. */}
              {item.shortLabel ? (
                <>
                  <span aria-hidden className="lg:hidden">
                    {item.shortLabel}
                  </span>
                  <span className="max-lg:sr-only">{item.label}</span>
                </>
              ) : (
                item.label
              )}
            </Link>
            {active ? (
              <ViewTransition
                name="header-indicator"
                share="nav-indicator"
                enter="indicator-enter"
                exit="indicator-exit"
                default="none"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-2.5 bottom-0 h-[3px] -skew-x-[30deg] bg-accent lg:inset-x-3.5"
                />
              </ViewTransition>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
