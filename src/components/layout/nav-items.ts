import { History, LayoutDashboard, Settings, Swords, type LucideIcon } from "lucide-react";

import { t } from "@/i18n/fr";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NEW_GAME: NavItem = { href: "/draft/new", label: t.nav.newGame, icon: Swords };

const DASHBOARD: NavItem = { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard };
const MATCHES: NavItem = { href: "/matches", label: t.nav.matches, icon: History };
const SETTINGS: NavItem = { href: "/settings", label: t.nav.settings, icon: Settings };

/**
 * Liens de la barre du haut (ordinateur) : ce qu'on consulte. « Nouvelle game »
 * y est un bouton à part, et les paramètres se rangent dans le menu du compte,
 * comme sur les sites de statistiques dont les joueurs ont l'habitude.
 */
export const HEADER_ITEMS: NavItem[] = [DASHBOARD, MATCHES];

/** Onglets de la barre du bas (téléphone). */
export const TAB_ITEMS: NavItem[] = [DASHBOARD, NEW_GAME, MATCHES, SETTINGS];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
