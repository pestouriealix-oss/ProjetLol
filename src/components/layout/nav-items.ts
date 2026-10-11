import { History, LayoutDashboard, Settings, Swords, type LucideIcon } from "lucide-react";

import { t } from "@/i18n/fr";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NEW_GAME: NavItem = { href: "/draft/new", label: t.nav.newGame, icon: Swords };

/** Liens de la barre du haut (ordinateur). */
export const HEADER_ITEMS: NavItem[] = [
  { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
  { href: "/matches", label: t.nav.matches, icon: History },
];

/** Onglets de la barre du bas (téléphone). */
export const TAB_ITEMS: NavItem[] = [
  { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
  NEW_GAME,
  { href: "/matches", label: t.nav.matches, icon: History },
  { href: "/settings", label: t.nav.settings, icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
