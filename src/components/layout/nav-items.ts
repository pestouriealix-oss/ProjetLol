import {
  ChartLine,
  History,
  LayoutDashboard,
  Newspaper,
  Swords,
  Target,
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
const PROGRESSION: NavItem = {
  href: "/progression",
  label: t.nav.progression,
  shortLabel: t.nav.progressionShort,
  icon: Target,
};

/**
 * Liens de la barre du haut (ordinateur) : ce qu'on consulte. « Nouvelle game »
 * y est un bouton à part, et les paramètres se rangent dans le menu du compte,
 * comme sur les sites de statistiques dont les joueurs ont l'habitude.
 */
export const HEADER_ITEMS: NavItem[] = [DASHBOARD, MATCHES, PROGRESSION, STATS, ESPORT, NEWS];

/**
 * Onglets de la barre du bas (téléphone) : « Nouvelle game » au centre, sous le
 * pouce, l'objectif du coach et l'esport à sa droite. Les statistiques
 * détaillées s'ouvrent aussi depuis le tableau de bord (« Toutes les stats »).
 */
export const TAB_ITEMS: NavItem[] = [DASHBOARD, MATCHES, NEW_GAME, PROGRESSION, ESPORT];

/** Liens du menu du compte, au téléphone seulement : ce que la barre du bas ne montre pas. */
export const MENU_ITEMS: NavItem[] = [STATS, NEWS];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
