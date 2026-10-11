"use client";

import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";

import { isActive, NEW_GAME } from "./nav-items";

/**
 * L'action principale de l'en-tête (ordinateur). Sur sa propre page, le bouton
 * se détoure pour dire « tu y es », comme le repère sous les autres liens.
 */
export function NewGameLink() {
  const pathname = usePathname();
  const Icon = NEW_GAME.icon;
  return (
    <Button
      asChild
      size="sm"
      className="hidden outline-offset-[3px] outline-accent/45 aria-[current=page]:outline-2 md:inline-flex"
    >
      <Link
        href={NEW_GAME.href}
        aria-current={isActive(pathname, NEW_GAME.href) ? "page" : undefined}
      >
        <Icon aria-hidden />
        {NEW_GAME.label}
      </Link>
    </Button>
  );
}
