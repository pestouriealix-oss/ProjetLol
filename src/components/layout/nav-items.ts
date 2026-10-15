import {
  ChartLine,
  History,
  LayoutDashboard,
  Newspaper,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { t } from "@/i18n/fr";

export type NavItem = {
  href: string;
  label: string;
  /** Libellé court de la barre du bas, où cinq onglets se partagent la largeur d'un téléphone. */
  shortLabel?: string;
  icon: LucideIcon;
};

export const NEW_GAME: NavItem = {
  href: "/draft/new",
  label: t.nav.newGame,
  shortLabel: t.nav.newGameShort,
  icon: Swords,
};

const DASHBOARD: NavItem = {
  href: "/dashboard",
  label: t.nav.dashboard,
  shortLabel: t.nav.dashboardShort,
  icon: LayoutDashboard,
};
const MATCHES: NavItem = { href: "/matches", label: t.nav.matches, icon: History };
const NEWS: NavItem = { href: "/news", label: t.nav.news, icon: Newspaper };
const ESPORT: NavItem = { href: "/esport", label: t.nav.esport, icon: Trophy };
const STATS: NavItem = { href: "/stats", label: t.nav.stats, icon: ChartLine };

/**
 * Liens de la barre du haut (ordinateur) : ce qu'on consulte. « Nouvelle game »
 * y est un bouton à part, et les paramètres se rangent dans le menu du compte,
 * comme sur les sites de statistiques dont les joueurs ont l'habitude.
 */
export const HEADER_ITEMS: NavItem[] = [DASHBOARD, MATCHES, STATS, ESPORT, NEWS];

/** Onglets de la barre du bas (téléphone). Les paramètres sont dans le menu du compte. */
export const TAB_ITEMS: NavItem[] = [DASHBOARD, NEW_GAME, MATCHES, ESPORT, NEWS];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
